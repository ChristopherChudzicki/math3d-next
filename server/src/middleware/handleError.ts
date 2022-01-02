import { ClientError } from "../util/errors";
import { Request, Response, NextFunction } from "express";

const handleError = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(error);
  }

  const details =
    error instanceof ClientError
      ? { error: String(error), status: error.status }
      : { error: "Internal Error", status: 500 };

  // res.setHeader("Content-Type", "application/json");
  // res.end(JSON.stringify({ error }));
};
