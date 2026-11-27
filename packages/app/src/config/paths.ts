import type { RegisteredRouter } from "@tanstack/react-router";

// Where allauth sends an error it can't return to callback_url
// (HEADLESS_FRONTEND_URLS on the backend).
export const SIGN_IN_ERROR_PATH =
  "/app/sign-in-error" satisfies keyof RegisteredRouter["routesByPath"];
