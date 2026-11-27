import * as Sentry from "@sentry/react";
import type { AnyRouter } from "@tanstack/react-router";
import { APP_VERSION } from "@/config/version";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Unset DSN ⇒ no-op. Production is the only environment that supplies one.
if (dsn) {
  Sentry.init({
    dsn,
    environment: "production",
    release: APP_VERSION,
    sendDefaultPii: false,
    tracesSampleRate: 1,
  });
}

/**
 * Traces page loads and navigations, named by route id (`/{-$sceneKey}`).
 * Call before the router's first load, which names the page-load span.
 */
export const traceRouter = (router: AnyRouter) => {
  if (!dsn) return;
  Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router));
};
