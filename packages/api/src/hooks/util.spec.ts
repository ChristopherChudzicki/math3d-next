import { afterEach, describe, expect, it, vi } from "vitest";
import type { MiddlewareCallbackParams } from "openapi-fetch";
import { csrfMiddleware } from "./util";

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
