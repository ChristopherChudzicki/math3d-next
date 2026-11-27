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
 * The app's one way to edit the current URL's search params. Keeps the path,
 * hash, history state and scroll position; a bare `navigate` drops the hash
 * and the state.
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
