import type { Request, Response, NextFunction } from "express";
import { ClientError } from "../util/errors";
import {
  decodeTokenType,
  parseAuthHeaderForBearer,
  accessToken,
} from "../util/auth";

export class Context {
  isAccessTokenValidated: boolean;

  userId?: string;

  constructor() {
    this.isAccessTokenValidated = false;
  }

  setUserId(userId: string): void {
    this.userId = userId;
    this.isAccessTokenValidated = true;
  }

  mustGetUserId(): string {
    if (this.userId) return this.userId;
    throw new ClientError("Forbidden", 403);
  }
}

const attachContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  req.context = new Context();
  const encoded = parseAuthHeaderForBearer(req.headers.authorization ?? "");
  const tokenType = decodeTokenType(encoded);
  if (tokenType !== accessToken.type) {
    return next();
  }
  const { userId } = accessToken.verify(encoded);
  req.context.setUserId(userId);
  return next();
};

export default attachContext;
