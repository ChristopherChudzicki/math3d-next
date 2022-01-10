import type { Request, Response, NextFunction } from "express";
import { ClientError } from "../util/errors";
import {
  decodeTokenType,
  parseAuthHeaderForBearer,
  accessToken,
} from "../util/auth";

export class Context {
  hasValidAccessToken: boolean;

  private _userId?: string;

  constructor() {
    this.hasValidAccessToken = false;
    this.mustGetUserId = this.mustGetUserId.bind(this);
  }

  get userId(): string | undefined {
    return this._userId;
  }

  setValidatedUserId(userId: string): void {
    this._userId = userId;
    this.hasValidAccessToken = true;
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
  req.context.setValidatedUserId(userId);
  return next();
};

export default attachContext;
