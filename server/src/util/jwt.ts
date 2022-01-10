/**
 * jsonwebtoken throws SyntaxError for malformed JWTs, see:
 * - https://github.com/auth0/node-jsonwebtoken/issues/652
 * - https://github.com/auth0/node-jsonwebtoken/issues/591
 *
 * and open PR (with lots of failing tests):
 * - https://github.com/auth0/node-jsonwebtoken/issues/652
 *
 * This file patches the jwt interface to throw a JsonWebTokenError in these
 * cases instead.
 */

import * as jwt from "jsonwebtoken";

const JWT_ERRORS = [
  jwt.JsonWebTokenError,
  jwt.NotBeforeError,
  jwt.TokenExpiredError,
];

const isJwtError = (error: unknown): boolean =>
  JWT_ERRORS.some((ErrorConstructor) => error instanceof ErrorConstructor);

const throwJsonWebTokenErrorAsBackup =
  (syncFunc: any) =>
  (...args: unknown[]) => {
    try {
      return syncFunc(...args);
    } catch (err) {
      if (isJwtError(err)) throw err;
      throw new jwt.JsonWebTokenError("Malformed Token");
    }
  };

const verify: typeof jwt.verify = throwJsonWebTokenErrorAsBackup(jwt.verify);

const decode: typeof jwt.decode = throwJsonWebTokenErrorAsBackup(jwt.decode);

export * from "jsonwebtoken";
export { verify, decode };
