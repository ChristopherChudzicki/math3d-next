import jwt from "jsonwebtoken";
import { accessToken, signupToken } from "../../src/util/auth";
import { ClientError } from "../../src/util/errors";
import { getThrownError } from "../testUtils";

describe("accessToken", () => {
  it("signs and verifies tokens", () => {
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    const token = accessToken.verify(encoded);

    expect(token.userId).toBe(userId);
  });

  it("creates tokens that expire after 30 minutes", async () => {
    jest.useFakeTimers();
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    jest.advanceTimersByTime(1000 * 60 * 30);
    const error = await getThrownError(() => accessToken.verify(encoded));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(401);
    expect(String(error)).toMatch(/expired/);
  });

  it("denies tokens created with the wrong secret", async () => {
    const badSignature = jwt.sign("woof", "bad secret");
    const error = await getThrownError(() => accessToken.verify(badSignature));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Unauthorized/);
  });

  it("denies signup tokens", async () => {
    const token = signupToken.generate("leo@woofwoof.come");
    const error = await getThrownError(() => accessToken.verify(token));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Unauthorized/);
  });
});

describe("signupToken", () => {
  it("signs and verifies tokens", () => {
    const email = "leo@woofwoof.com";
    const signed = signupToken.generate(email);
    const token = signupToken.verify(signed);

    expect(token.email).toBe(email);
  });

  it("creates tokens that expire after 30 minutes", async () => {
    jest.useFakeTimers();
    const email = "leo@woofwoof.com";
    const signed = signupToken.generate(email);
    jest.advanceTimersByTime(1000 * 60 * 30);
    const error = await getThrownError(() => signupToken.verify(signed));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(401);
    expect(String(error)).toMatch(/expired/);
  });

  it("denies tokens created with the wrong secret", async () => {
    const badSignature = jwt.sign("woof", "bad secret");
    const error = await getThrownError(() => signupToken.verify(badSignature));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Unauthorized/);
  });

  it("denies access tokens", async () => {
    const token = accessToken.generate("leo@woofwoof.come");
    const error = await getThrownError(() => signupToken.verify(token));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Unauthorized/);
  });
});
