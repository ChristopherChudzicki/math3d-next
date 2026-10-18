import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import { isApiError } from "@math3d/api";
import { dismissToast, showToast } from "@/features/toasts";

const RETRY_STATUS_CODES = [408, 429, 502, 503, 504];
const MAX_RETRIES = 3;

const DEFAULT_ERROR_TOAST = "Something went wrong. Please try again later.";

/**
 * Reports every mutation failure to Sentry, and toasts it unless the call site
 * opts out with `meta: { errorToast: false }`.
 */
const createMutationCache = (): MutationCache =>
  new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      Sentry.captureException(error);
      const copy = mutation.meta?.errorToast;
      if (copy !== false) showToast(copy ?? DEFAULT_ERROR_TOAST);
    },
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      // Only a site's own copy identifies its failure; the default is shared.
      const copy = mutation.meta?.errorToast;
      if (typeof copy === "string") dismissToast(copy);
    },
  });

/**
 * Reports query failures to Sentry, except the statuses a query declares in
 * `meta.expectedErrors`. No toast: each query shows its own failure where its
 * data would be.
 */
const createQueryCache = (): QueryCache =>
  new QueryCache({
    onError: (error, query) => {
      if (isApiError(error, query.meta?.expectedErrors ?? [])) return;
      // The key's leading parts name the endpoint; the rest can hold user
      // input, like a scene key or a title filter.
      Sentry.captureException(error, {
        tags: { query: query.queryKey.slice(0, 2).join(".") },
      });
    },
  });

const createQueryClient = (): QueryClient => {
  return new QueryClient({
    queryCache: createQueryCache(),
    mutationCache: createMutationCache(),
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        retry: (failureCount, error) => {
          const status = isApiError(error) ? error.status : undefined;
          /**
           * React Query's default behavior is to retry all failed queries 3
           * times. Many things (e.g., 403, 404) are not worth retrying. Let's
           * just retry some explicit whitelist of status codes.
           */
          if (status !== undefined && RETRY_STATUS_CODES.includes(status)) {
            return failureCount < MAX_RETRIES;
          }
          return false;
        },
      },
    },
  });
};

export {
  createQueryClient,
  createQueryCache,
  createMutationCache,
  DEFAULT_ERROR_TOAST,
};
