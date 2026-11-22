import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import { APP_VERSION } from "@/config/version";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Reports reduce a non-HTTP(S) URL to its bare scheme, e.g. "chrome-extension".
const EXTENSION_SCHEME = /^(chrome|moz|safari(-web)?)-extension(:|$)/;

/**
 * Sends each Content-Security-Policy violation to Sentry, except those caused
 * by browser extensions. Sentry's default dedupe drops immediate repeats.
 */
const reportCspViolations = () => {
  document.addEventListener("securitypolicyviolation", (event) => {
    if (
      EXTENSION_SCHEME.test(event.sourceFile) ||
      EXTENSION_SCHEME.test(event.blockedURI)
    ) {
      return;
    }
    Sentry.captureMessage(
      `CSP violation: ${event.effectiveDirective} blocked ${event.blockedURI}`,
      {
        level: "warning",
        extra: {
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          sample: event.sample,
        },
      },
    );
  });
};

// Unset DSN ⇒ no-op. Production is the only environment that supplies one.
if (dsn) {
  Sentry.init({
    dsn,
    environment: "production",
    release: APP_VERSION,
    sendDefaultPii: false,
    tracesSampleRate: 1,
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
  });
  reportCspViolations();
}

// Scene URLs are `/:sceneKey`; the wrapper names transactions by matched route
// pattern. Must stay below init(), or it returns createBrowserRouter unwrapped.
export const createRouter =
  Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);
