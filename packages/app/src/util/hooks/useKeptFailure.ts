import { useState } from "react";
import type { FetchStatus } from "@tanstack/react-query";

type QueryLike = {
  data: unknown;
  error: Error | null;
  fetchStatus: FetchStatus;
  errorUpdateCount: number;
  refetch: () => unknown;
};

type State = {
  key: string;
  failure: Error | null;
  /** The last error judged by `keep()`, kept or not. */
  seen: Error | null;
};

/**
 * Keeps a query's failure on screen while the user retries it.
 *
 * `refetch()` on a query with no data resets it to pending, clearing `error`,
 * so a UI that reads `error` directly swaps its message for a spinner and drops
 * focus from the retry button. This keeps the last failure until data arrives
 * or `key` changes.
 *
 * A new error is kept only if `keep()` says so when it arrives. `hasData`
 * overrides `data !== undefined`, e.g. to discount placeholder data.
 */
const useKeptFailure = (
  query: QueryLike,
  {
    key,
    keep = () => true,
    hasData = query.data !== undefined,
  }: { key: string; keep?: () => boolean; hasData?: boolean },
) => {
  const [state, setState] = useState<State>({ key, failure: null, seen: null });

  // Adjusting state during render, so the failure shows in the same render as
  // the error: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  let current = state;
  if (current.key !== key) {
    current = { key, failure: null, seen: null };
  }
  if (hasData) {
    if (current.failure) current = { ...current, failure: null };
  } else if (query.error && query.error !== current.seen) {
    current = {
      ...current,
      seen: query.error,
      failure: keep() ? query.error : current.failure,
    };
  }
  if (current !== state) setState(current);

  return {
    /** The last failure for `key`, kept through refetches until data arrives. */
    failure: current.failure,
    /** A fetch is in flight (or paused) while the failure shows. */
    retrying: query.fetchStatus !== "idle",
    /** Changes with each failed fetch; key the live region on it. */
    failedAttempts: query.errorUpdateCount,
    retry: () => {
      query.refetch();
    },
  };
};

export default useKeptFailure;
