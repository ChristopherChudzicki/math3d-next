import { classifyFailure } from "@math3d/api";

const DEFAULT_ERROR_COPY = "Something went wrong. Please try again later.";
const UNREACHABLE_COPY =
  "Couldn’t reach Math3d. Check your connection, or try again in a moment.";

/** What to tell the user when an action fails, for a toast or inline error. */
const failureMessage = (error: unknown): string =>
  classifyFailure(error) === "unreachable"
    ? UNREACHABLE_COPY
    : DEFAULT_ERROR_COPY;

export { DEFAULT_ERROR_COPY, UNREACHABLE_COPY, failureMessage };
