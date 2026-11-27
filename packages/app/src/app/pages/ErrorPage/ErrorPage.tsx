import React from "react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import * as Sentry from "@sentry/react";
import copy from "./errorPage.copy";
import ErrorView from "./ErrorView";

interface NormalizedError {
  message: string;
  stack?: string;
}

/** Turn whatever was thrown into a message + optional stack for display. */
const normalizeError = (error: unknown): NormalizedError => {
  if (error instanceof Error) {
    return { message: error.message || copy.unknownError, stack: error.stack };
  }
  if (typeof error === "string" && error.trim()) {
    return { message: error };
  }
  // A thrown plain object may still carry a usable message.
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return { message: error.message };
  }
  return { message: copy.unknownError };
};

/** The root route's `onCatch`: runs once per error its boundary catches. */
const reportRenderError = (error: unknown) => {
  // Not `handled: true` (captureException's default): this error took the
  // user to the fallback page.
  Sentry.captureException(error, {
    mechanism: { type: "tanstack-router.errorComponent", handled: false },
  });
};

/**
 * The root route's `errorComponent`: catches render errors anywhere in the
 * routed tree and shows the branded fallback instead of the router's default.
 *
 * For render crashes only. A failed API request shows where its data would be,
 * and the React Query caches report it.
 */
const ErrorPage: React.FC<Pick<ErrorComponentProps, "error">> = ({ error }) => {
  const { message, stack } = normalizeError(error);
  return <ErrorView message={message} stack={stack} />;
};

export { normalizeError, reportRenderError };
export default ErrorPage;
