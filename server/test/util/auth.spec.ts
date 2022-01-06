import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import { accessToken, signupToken } from "../../src/util/auth";

describe("accessToken", () => {
  it("signs and verifies tokens", () => {
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    const token = accessToken.verify(encoded);

    expect(token.userId).toBe(userId);
  });

  it("creates tokens that expire after 30 minutes", () => {
    jest.useFakeTimers();
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    jest.advanceTimersByTime(1000 * 60 * 30);
    expect(() => accessToken.verify(encoded)).toThrowError(TokenExpiredError);
  });

  it("denies tokens created with the wrong secret", () => {
    const badEncoding = jwt.sign("woof", "bad secret");
    expect(() => accessToken.verify(badEncoding)).toThrow(JsonWebTokenError);
    expect(() => accessToken.verify(badEncoding)).toThrow("invalid signature");
  });

  it("denies signup tokens", () => {
    const badEncoding = signupToken.generate("leo@woofwoof.come");
    expect(() => accessToken.verify(badEncoding)).toThrow(JsonWebTokenError);
    expect(() => accessToken.verify(badEncoding)).toThrow("invalid signature");
  });
});

describe("signupToken", () => {
  it("signs and verifies tokens", () => {
    const email = "leo@woofwoof.com";
    const encoded = signupToken.generate(email);
    const token = signupToken.verify(encoded);

    expect(token.email).toBe(email);
  });

  it("creates tokens that expire after 30 minutes", () => {
    jest.useFakeTimers();
    const email = "leo@woofwoof.com";
    const encoded = signupToken.generate(email);
    jest.advanceTimersByTime(1000 * 60 * 30);
    expect(() => signupToken.verify(encoded)).toThrowError(TokenExpiredError);
  });

  it("denies tokens created with the wrong secret", () => {
    const badEncoding = jwt.sign("woof", "bad secret");
    expect(() => signupToken.verify(badEncoding)).toThrow(JsonWebTokenError);
    expect(() => signupToken.verify(badEncoding)).toThrow("invalid signature");
  });

  it("denies access tokens", () => {
    const badEncoding = accessToken.generate("leo@woofwoof.come");
    expect(() => signupToken.verify(badEncoding)).toThrow(JsonWebTokenError);
    expect(() => signupToken.verify(badEncoding)).toThrow("invalid signature");
  });
});
