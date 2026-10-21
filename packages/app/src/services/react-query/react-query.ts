import {
  MutationCache,
  QueryCache,
  QueryClient,
  type Query,
} from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import {
  ApiError,
  NetworkError,
  classifyFailure,
  isApiError,
} from "@math3d/api";
import { dismissToast, showToast } from "@/ui/Toast/toasts";

const RETRY_STATUS_CODES = [408, 429, 502, 503, 504];
const MAX_RETRIES = 3;

const DEFAULT_ERROR_TOAST = "Something went wrong. Please try again later.";
const UNREACHABLE_COPY =
  "Couldn’t reach Math3d. Check your connection and try again.";

/** The backend's 500 body names its own Sentry event (`main/views.py`). */
const backendEventId = (data: unknown): string | undefined => {
  if (typeof data !== "object" || data === null) return undefined;
  const id = (data as { sentry_event_id?: unknown }).sentry_event_id;
  return typeof id === "string" ? id : undefined;
};

/**
 * Report a failed query or mutation to Sentry, unless its status is one the
 * caller expects. Network failures are warnings grouped per endpoint, so one
 * flaky client is a trickle and a misconfiguration is a spike.
 */
const reportFailure = (
  error: unknown,
  {
    expectedErrors,
    tags = {},
  }: { expectedErrors?: number[]; tags?: Record<string, string> } = {},
): void => {
  if (classifyFailure(error, expectedErrors) === "expected") return;
  if (error instanceof NetworkError) {
    Sentry.captureException(error, {
      level: "warning",
      fingerprint: ["network", error.method, error.schemaPath],
      tags,
    });
    return;
  }
  if (error instanceof ApiError && error.method && error.schemaPath) {
    const eventId = backendEventId(error.data);
    Sentry.captureException(error, {
      fingerprint: ["api", error.method, error.schemaPath, `${error.status}`],
      tags: {
        ...tags,
        "api.method": error.method,
        "api.path": error.schemaPath,
        "api.status": `${error.status}`,
        ...(eventId && { backend_event_id: eventId }),
      },
    });
    return;
  }
  Sentry.captureException(error, { tags });
};

/**
 * Reports mutation failures to Sentry (see `reportFailure`), and toasts them
 * unless the call site opts out with `meta: { errorToast: false }`.
 */
const createMutationCache = (): MutationCache =>
  new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      reportFailure(error, { expectedErrors: mutation.meta?.expectedErrors });
      const copy = mutation.meta?.errorToast;
      if (copy === false) return;
      const fallback =
        classifyFailure(error) === "unreachable"
          ? UNREACHABLE_COPY
          : DEFAULT_ERROR_TOAST;
      showToast(copy ?? fallback);
    },
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      // Only a site's own copy identifies its failure; the default is shared.
      const copy = mutation.meta?.errorToast;
      if (typeof copy === "string") dismissToast(copy);
    },
  });

/**
 * Reports query failures to Sentry (see `reportFailure`). No toast: each query
 * shows its own failure where its data would be.
 */
const createQueryCache = (): QueryCache =>
  new QueryCache({
    onError: (error, query) => {
      reportFailure(error, {
        expectedErrors: query.meta?.expectedErrors,
        // The key's leading parts name the endpoint; the rest can hold user
        // input, like a scene key or a title filter.
        tags: { query: query.queryKey.slice(0, 2).join(".") },
      });
    },
  });

/** Refetching a failed query helps only if the failure was the network. */
const refetchUnlessBroken = (query: Query): boolean =>
  query.state.status !== "error" ||
  classifyFailure(query.state.error) === "unreachable";

const createQueryClient = (): QueryClient => {
  return new QueryClient({
    queryCache: createQueryCache(),
    mutationCache: createMutationCache(),
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: (failureCount, error) => {
          /**
           * React Query's default behavior is to retry all failed queries 3
           * times. Many things (e.g., 403, 404) are not worth retrying. Let's
           * just retry some explicit whitelist of status codes, and requests
           * that got no response.
           */
          const retryable =
            classifyFailure(error) === "unreachable" ||
            isApiError(error, RETRY_STATUS_CODES);
          return retryable && failureCount < MAX_RETRIES;
        },
        refetchOnWindowFocus: refetchUnlessBroken,
        refetchOnReconnect: refetchUnlessBroken,
      },
    },
  });
};

export {
  createQueryClient,
  createQueryCache,
  createMutationCache,
  DEFAULT_ERROR_TOAST,
  UNREACHABLE_COPY,
};
