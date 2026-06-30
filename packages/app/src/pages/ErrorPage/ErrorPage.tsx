import React from "react";
import { useRouteError, isRouteErrorResponse } from "react-router";
import copy from "./errorPage.copy";
import ErrorView from "./ErrorView";

interface NormalizedError {
  message: string;
  stack?: string;
}

/** Turn whatever was thrown into a message + optional stack for display. */
const normalizeError = (error: unknown): NormalizedError => {
  if (isRouteErrorResponse(error)) {
    const message = `${error.status} ${error.statusText}`.trim();
    // A loader/action can carry a human-readable body in `data`; surface it.
    const detail = typeof error.data === "string" ? error.data.trim() : "";
    return detail ? { message, stack: detail } : { message };
  }
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

/**
 * Route-level `errorElement`: catches render errors anywhere in the routed tree
 * and shows the branded fallback instead of React Router's raw default.
 */
const ErrorPage: React.FC = () => {
  const error = useRouteError();
  const { message, stack } = normalizeError(error);
  return <ErrorView message={message} stack={stack} />;
};

export { normalizeError };
export default ErrorPage;
