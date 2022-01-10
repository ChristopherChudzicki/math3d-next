import jwt from "jsonwebtoken";
import {
  accessToken,
  signupToken,
  parseAuthHeaderForBearer,
  decodeTokenType,
} from "../../src/util/auth";
import { ClientError } from "../../src/util/errors";
import { getRejection } from "../testUtils";

describe("accessToken", () => {
  it("signs and verifies tokens", () => {
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    const token = accessToken.verify(encoded);
    expect(token).toStrictEqual({
      userId,
      type: "access",
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it("creates tokens that expire after 30 minutes", async () => {
    jest.useFakeTimers();
    const userId = "leo";
    const encoded = accessToken.generate(userId);
    jest.advanceTimersByTime(1000 * 60 * 30);
    const error = await getRejection(() => accessToken.verify(encoded));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(401);
    expect(String(error)).toMatch(/expired/);
  });

  it("denies tokens created with the wrong secret", async () => {
    const badSignature = jwt.sign("woof", "bad secret");
    const error = await getRejection(() => accessToken.verify(badSignature));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Forbidden/);
  });

  it("denies signup tokens", async () => {
    const token = signupToken.generate("leo@woofwoof.come");
    const error = await getRejection(() => accessToken.verify(token));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Forbidden/);
  });
});

describe("signupToken", () => {
  it("signs and verifies tokens", () => {
    const email = "leo@woofwoof.com";
    const signed = signupToken.generate(email);
    const token = signupToken.verify(signed);
    expect(token).toStrictEqual({
      email,
      type: "signup",
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it("creates tokens that expire after 30 minutes", async () => {
    jest.useFakeTimers();
    const email = "leo@woofwoof.com";
    const signed = signupToken.generate(email);
    jest.advanceTimersByTime(1000 * 60 * 30);
    const error = await getRejection(() => signupToken.verify(signed));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(401);
    expect(String(error)).toMatch(/expired/);
  });

  it("denies tokens created with the wrong secret", async () => {
    const badSignature = jwt.sign("woof", "bad secret");
    const error = await getRejection(() => signupToken.verify(badSignature));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Forbidden/);
  });

  it("denies access tokens", async () => {
    const token = accessToken.generate("leo@woofwoof.come");
    const error = await getRejection(() => signupToken.verify(token));
    expect(error).toBeInstanceOf(ClientError);
    expect(error.status).toBe(403);
    expect(String(error)).toMatch(/Forbidden/);
  });
});

describe("parseAuthHeaderForBearer", () => {
  it("returns token when scheme is Bearer", () => {
    expect(parseAuthHeaderForBearer("Bearer woofwoof")).toBe("woofwoof");
  });

  it("returns ignores whitespace after 'Bearer'", () => {
    expect(parseAuthHeaderForBearer("Bearer      meow")).toBe("meow");
  });

  it("returns empty string if scheme is not 'Bearer'", () => {
    expect(parseAuthHeaderForBearer("BEARER woofwoof")).toBe("");
  });
});

describe("decodeTokenType", () => {
  it("returns null for invalid encodings", () => {
    expect(decodeTokenType("cat")).toBeNull();
  });
  it("returns null for encoded strings", () => {
    const encoded = jwt.sign("cat", "some_secret");
    expect(decodeTokenType(encoded)).toBeNull();
  });
  it("returns undefined for encoded objects missing type", () => {
    const encoded = jwt.sign({ cat: "meows" }, "some_secret");
    expect(decodeTokenType(encoded)).toBeNull();
  });
  it("returns the type property for encoded objects with type", () => {
    const encoded = jwt.sign({ cat: "meows", type: "cat" }, "some_secret");
    expect(decodeTokenType(encoded)).toBe("cat");
  });
});
