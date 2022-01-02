import jwt from "jsonwebtoken";
import getEnvVar from "./getEnvVar";

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

export const accessToken = {
  generate(userId: string): string {
    const payload = { userId };
    return jwt.sign(payload, JWT_SECRET_ACCESS, {
      expiresIn: JWT_EXPIRATION,
    });
  },
  verify(token: string): AccessToken {
    const verified = jwt.verify(token, JWT_SECRET_ACCESS) as AccessToken;
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
    const verified = jwt.verify(token, JWT_SECRET_SIGNUP) as SignupToken;
    return verified;
  },
};
