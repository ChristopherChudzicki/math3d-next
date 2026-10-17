import type { QueryClient } from "@tanstack/react-query";

type MutationMeta = {
  /**
   * Toast copy when the mutation fails. Omitted: generic copy. `false`: no
   * toast — the call site renders its own error or builds its own toast.
   */
  errorToast?: string | false;
};

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /**
       * True when the endpoint returns the same body no matter who is asking
       * (or whether anyone is signed in at all).
       *
       * Tags a fact about the endpoint, not a caching policy: answer it from
       * the API, and `resetOnAuthChange` derives the policy. Leaving it off is
       * the safe default — an untagged query is assumed to be user-specific
       * and gets cleared, so forgetting it costs a refetch rather than showing
       * one account's data to the next.
       */
      sameForAllUsers?: boolean;
    };
    mutationMeta: MutationMeta;
  }
}

type MutationHookOptions = { meta?: MutationMeta };

/**
 * Clear every cached query whose contents could differ per user, for use when
 * the signed-in identity changes (login, logout, account deletion).
 *
 * Resets rather than invalidates so the previous user's data is gone
 * immediately; invalidating would leave it on screen until the refetch lands.
 */
const resetOnAuthChange = (queryClient: QueryClient): Promise<void> =>
  queryClient.resetQueries({
    predicate: (query) => query.meta?.sameForAllUsers !== true,
  });

export { resetOnAuthChange };
export type { MutationHookOptions, MutationMeta };
