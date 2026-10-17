import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  reactRouterV7BrowserTracingIntegration: vi.fn(() => ({ name: "mock" })),
  wrapCreateBrowserRouterV7: vi.fn((create) => create),
}));

describe("Sentry init", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("does not initialize when no DSN is configured", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    await import("./sentry");
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  test("initializes with tracing and no PII when a DSN is configured", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://abc123@o1.ingest.sentry.io/42");
    vi.stubEnv("VITE_APP_VERSION", "1.2.3");
    await import("./sentry");
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://abc123@o1.ingest.sentry.io/42",
        environment: "production",
        release: "1.2.3",
        sendDefaultPii: false,
        tracesSampleRate: 1,
        integrations: [{ name: "mock" }],
      }),
    );
    expect(Sentry.reactRouterV7BrowserTracingIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    );
    // The wrapper reads state that init() installs, so init must run first.
    expect(vi.mocked(Sentry.init).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(Sentry.wrapCreateBrowserRouterV7).mock.invocationCallOrder[0],
    );
  });

  test("wraps the real createBrowserRouter for route instrumentation", async () => {
    await import("./sentry");
    const { createBrowserRouter } = await import("react-router-dom");
    expect(Sentry.wrapCreateBrowserRouterV7).toHaveBeenCalledWith(
      createBrowserRouter,
    );
  });
});
