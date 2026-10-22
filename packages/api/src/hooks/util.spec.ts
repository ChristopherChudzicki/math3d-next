import { afterEach, describe, expect, it, vi } from "vitest";
import type { MiddlewareCallbackParams } from "openapi-fetch";
import { createV1Client, csrfMiddleware, unwrap } from "./util";
import { ApiError, NetworkError } from "../util";

// csrfMiddleware reads the CSRF token from document.cookie and attaches it as
// the X-CSRFToken header — but only on unsafe methods, since Django exempts
// safe ones. onRequest only reads `request`, so we pass a minimal params shape.
describe("csrfMiddleware", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const applyMiddleware = (
    method: string,
    cookie = "csrftoken=test-token",
  ): Request => {
    vi.stubGlobal("document", { cookie });
    const request = new Request("http://api.test/resource", { method });
    csrfMiddleware.onRequest?.({
      request,
    } as unknown as MiddlewareCallbackParams);
    return request;
  };

  it("attaches the CSRF token on unsafe methods", () => {
    const request = applyMiddleware("POST");
    expect(request.headers.get("X-CSRFToken")).toBe("test-token");
  });

  it("skips the header on safe methods", () => {
    const request = applyMiddleware("GET");
    expect(request.headers.get("X-CSRFToken")).toBeNull();
  });

  it("sets no header when no token is available", () => {
    const request = applyMiddleware("POST", "");
    expect(request.headers.get("X-CSRFToken")).toBeNull();
  });
});

describe("apiFailureMiddleware", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const client = createV1Client({ baseUrl: "http://api.test" });
  const getScene = () =>
    client.GET("/v1/scenes/{key}/", { params: { path: { key: "abc" } } });

  it("turns a fetch rejection into a NetworkError naming the endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    const error = await getScene().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({
      method: "GET",
      schemaPath: "/v1/scenes/{key}/",
      message: "GET /v1/scenes/{key}/ → network error",
    });
  });

  it("names the endpoint in an ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );
    const error = await unwrap(getScene()).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      message: "GET /v1/scenes/{key}/ → 500",
    });
  });
});
