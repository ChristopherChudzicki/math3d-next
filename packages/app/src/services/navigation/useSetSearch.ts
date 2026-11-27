import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { HistoryState } from "@tanstack/react-router";
import type { AppLocation } from "./location";

/** Every search param of every route; `undefined` removes one. */
export type SearchPatch = Partial<AppLocation["search"]>;

type SetSearchOptions = {
  replace?: boolean;
  /** The new entry's history state, from the current entry's. Default: kept. */
  state?: (prev: AppLocation["state"]) => HistoryState;
};

/**
 * Edits the current URL's search params, keeping its path, hash, history state
 * and scroll position. The one way the app edits the current URL's search
 * params: a bare `navigate` drops the hash and the state.
 */
export const useSetSearch = () => {
  const navigate = useNavigate();
  return useCallback(
    (patch: SearchPatch, { replace, state }: SetSearchOptions = {}) =>
      navigate({
        // Against the URL's path, not the matched route's, so a page no route
        // matched (the not-found page) keeps its path.
        to: ".",
        unsafeRelative: "path",
        search: (prev) => ({ ...prev, ...patch }),
        hash: true,
        state: state ?? true,
        replace,
        resetScroll: false,
        hashScrollIntoView: false,
      }),
    [navigate],
  );
};
