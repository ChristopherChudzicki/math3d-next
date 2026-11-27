import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  addIntegration: vi.fn(),
  tanstackRouterBrowserTracingIntegration: vi.fn(() => ({ name: "mock" })),
}));

const router = {} as AnyRouter;

describe("Sentry init", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("does nothing when no DSN is configured", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const { traceRouter } = await import("./sentry");
    traceRouter(router);
    expect(Sentry.init).not.toHaveBeenCalled();
    expect(Sentry.addIntegration).not.toHaveBeenCalled();
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
      }),
    );
  });

  test("traces the router's navigations once it exists", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://abc123@o1.ingest.sentry.io/42");
    const { traceRouter } = await import("./sentry");
    traceRouter(router);
    expect(Sentry.tanstackRouterBrowserTracingIntegration).toHaveBeenCalledWith(
      router,
    );
    expect(Sentry.addIntegration).toHaveBeenCalledWith({ name: "mock" });
  });
});
