import * as jwt from "./jwt";
import getEnvVar from "./getEnvVar";
import { ClientError } from "./errors";

const JWT_SECRET = getEnvVar("JWT_SECRET");
const JWT_EXPIRATION = "30 min";
/**
 * For an authHeader string of form "Bearer<whitespace><tokenString>",
 * returns just tokenString
 */
export const parseAuthHeaderForBearer = (authHeader: string): string => {
  const scheme = "Bearer";
  if (!authHeader.startsWith(scheme)) return "";
  return authHeader.substring(scheme.length).trimStart();
};

type TokenType = "access" | "signup";

type AccessToken = {
  type: "access";
  userId: string;
  iat: number;
  exp: number;
};

type SignupToken = {
  type: "signup";
  email: string;
  iat: number;
  exp: number;
};

const verify = (token: string, type: TokenType, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === "string") {
      throw new ClientError("Forbidden", 403);
    }
    if (decoded.type !== type) {
      throw new ClientError("Forbidden", 403);
    }
    return decoded;
  } catch (error) {
    if (error instanceof ClientError) throw error;

    if (error instanceof jwt.TokenExpiredError) {
      throw new ClientError("Token expired", 401);
    }

    const isAuthError =
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.NotBeforeError;

    if (!isAuthError) {
      console.error(error);
    }

    throw new ClientError("Forbidden", 403);
  }
};

export const accessToken = {
  type: "access" as const,
  generate(userId: string): string {
    const payload = { userId, type: this.type };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
  },
  verify(token: string): AccessToken {
    const verified = verify(token, this.type, JWT_SECRET) as AccessToken;
    return verified;
  },
};

export const signupToken = {
  type: "signup" as const,
  generate(email: string): string {
    const payload = { email, type: this.type };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
  },
  verify(token: string): SignupToken {
    const verified = verify(token, this.type, JWT_SECRET) as SignupToken;
    return verified;
  },
  verifyHeader(authHeader: string): SignupToken {
    const token = parseAuthHeaderForBearer(authHeader);
    return this.verify(token);
  },
};

export const decodeTokenType = (encoded: string): string | null => {
  try {
    const decoded = jwt.decode(encoded);
    if (decoded === null) return null;
    if (typeof decoded === "string") return null;
    return decoded.type ?? null;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) return null;
    throw err;
  }
};
