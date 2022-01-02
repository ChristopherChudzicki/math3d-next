import { ClientError } from "../util/errors";
import { Request, Response, NextFunction } from "express";

const sendErrorResponse = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (res.headersSent) {
    return next(error);
  }

  const details =
    error instanceof ClientError
      ? { error: String(error), status: error.status }
      : { error: "Error: Internal Error", status: 500 };

  res.status(details.status);
  res.json({ error: details.error });

  return next(error);
};

export default sendErrorResponse;
