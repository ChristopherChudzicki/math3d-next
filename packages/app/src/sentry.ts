import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";
import { createBrowserRouter } from "react-router-dom";
import { APP_VERSION } from "@/version";

const dsn = import.meta.env.VITE_SENTRY_DSN;

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
}

// Scene URLs are `/:sceneKey`, so unwrapped routing would name one transaction
// per scene key. The wrapper reports the matched route pattern instead.
export const createRouter =
  Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);
