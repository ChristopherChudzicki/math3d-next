import jwt from "jsonwebtoken";
import getEnvVar from "./getEnvVar";
import { ClientError } from "./errors";

const JWT_SECRET = getEnvVar("JWT_SECRET");
const JWT_EXPIRATION = "30 min";
const JWT_SECRET_ACCESS = `access:${JWT_SECRET}`;
const JWT_SECRET_SIGNUP = `signup:${JWT_SECRET}`;

type AccessToken = {
  userId: string;
  iat: number;
  exp: number;
};

type SignupToken = {
  email: string;
  iat: number;
  exp: number;
};

const verify = (token: string, secret: string) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ClientError("Token expired", 401);
    }

    const isAuthError =
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError;

    if (!isAuthError) {
      console.error(error);
    }

    throw new ClientError("Unauthorized", 403);
  }
};

export const accessToken = {
  generate(userId: string): string {
    const payload = { userId };
    return jwt.sign(payload, JWT_SECRET_ACCESS, {
      expiresIn: JWT_EXPIRATION,
    });
  },
  verify(token: string): AccessToken {
    const verified = verify(token, JWT_SECRET_ACCESS) as AccessToken;
    return verified;
  },
};

export const signupToken = {
  generate(email: string): string {
    const payload = { email };
    return jwt.sign(payload, JWT_SECRET_SIGNUP, {
      expiresIn: JWT_EXPIRATION,
    });
  },
  verify(token: string): SignupToken {
    const verified = verify(token, JWT_SECRET_SIGNUP) as SignupToken;
    return verified;
  },
};

/**
 * For an authHeader string of form "Bearer<whitespace><tokenString>",
 * returns just tokenString
 */
export const parseAuthHeaderForBearer = (authHeader: string): string | null => {
  const scheme = "Bearer";
  if (!authHeader.startsWith(scheme)) return "";
  return authHeader.substring(scheme.length).trimStart();
};
