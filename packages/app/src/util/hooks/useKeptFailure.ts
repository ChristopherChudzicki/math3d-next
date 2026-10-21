import { useState } from "react";

type KeptFailure = {
  /** The last failure for `key`, kept through refetches until data arrives. */
  failure: Error | null;
  /** A retry started with `retry()` is in flight. */
  retrying: boolean;
  /** Increments each time a user-started retry fails; key the live region on it. */
  failedAttempts: number;
  retry: () => void;
};

type QueryLike = {
  error: Error | null;
  hasData: boolean;
  refetch: () => Promise<{ error: Error | null }>;
};

type State = {
  key: string;
  failure: Error | null;
  /** The last error judged by `keep()`, kept or not. */
  seen: Error | null;
  retrying: boolean;
  failedAttempts: number;
};

const initial = (key: string): State => ({
  key,
  failure: null,
  seen: null,
  retrying: false,
  failedAttempts: 0,
});

/**
 * Keeps a query's failure on screen while the user retries it.
 *
 * `refetch()` on a query with no data resets it to pending, clearing `error`,
 * so a UI that reads `error` directly swaps its message for a spinner and drops
 * focus from the retry button. This keeps the last failure until data arrives
 * or `key` changes.
 *
 * A new error is kept only if `keep()` says so when it arrives.
 */
const useKeptFailure = (
  query: QueryLike,
  { key, keep = () => true }: { key: string; keep?: () => boolean },
): KeptFailure => {
  const [state, setState] = useState(() => initial(key));

  // Adjusting state during render, so the failure shows in the same render as
  // the error: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  let current = state;
  if (current.key !== key) {
    current = initial(key);
  }
  if (query.hasData) {
    if (current.failure) current = { ...current, failure: null };
  } else if (query.error && query.error !== current.seen) {
    current = {
      ...current,
      seen: query.error,
      failure: keep() ? query.error : current.failure,
    };
  }
  if (current !== state) setState(current);

  const retry = () => {
    setState((prev) => ({ ...prev, retrying: true }));
    query.refetch().then(({ error }) => {
      setState((prev) => {
        if (prev.key !== key) return prev;
        if (!error) return { ...prev, retrying: false };
        // The render may already have judged this error.
        const kept = error === prev.seen ? prev.failure === error : keep();
        if (!kept) return { ...prev, seen: error, retrying: false };
        return {
          ...prev,
          failure: error,
          seen: error,
          retrying: false,
          failedAttempts: prev.failedAttempts + 1,
        };
      });
    });
  };

  return {
    failure: current.failure,
    retrying: current.retrying,
    failedAttempts: current.failedAttempts,
    retry,
  };
};

export default useKeptFailure;
