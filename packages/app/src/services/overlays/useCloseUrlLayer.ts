import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { useRouter } from "@tanstack/react-router";
import type { HistoryState } from "@tanstack/react-router";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import type { SearchPatch } from "@/services/navigation/useSetSearch";
import { useUrlLayerOpen } from "./UrlLayer";
import type { useUrlLayerLocation } from "./UrlLayer";

type CloseUrlLayerOptions = {
  /** Whether the app pushed the current history entry to open this layer. */
  pushed: boolean;
  /** Search params the layer owns, dropped when it closes in place. */
  params: readonly (keyof SearchPatch)[];
  /** History-state keys the layer owns, dropped when it closes in place. */
  stateKeys: readonly (keyof HistoryState)[];
  /** The caller's layer location, and its still-open ref. */
  location: ReturnType<typeof useUrlLayerLocation>;
  stillOpen: RefObject<boolean>;
};

const NOT_CLOSED = Symbol("not closed");

/** Closes a dialog that lives in the URL: `?overlay=`, or `?signin` above it. */
export const useCloseUrlLayer = ({
  pushed,
  params,
  stateKeys,
  location,
  stillOpen,
}: CloseUrlLayerOptions) => {
  const { history } = useRouter();
  const setSearch = useSetSearch();

  // Consumers close from more than one place — LogoutPage both closes on its
  // mutation's success and watches auth status — and popping twice would leave the app
  // entirely. Keyed on the entry rather than a bare flag so a later layer
  // still closes, and read through a ref so a stale closure sees it too.
  const closedKey = useRef<string | undefined | typeof NOT_CLOSED>(NOT_CLOSED);
  // URL layers stay mounted while closed, so the guard has to forget a close
  // once the layer reopens: Forward returns to the very entry it recorded.
  const urlLayerOpen = useUrlLayerOpen();
  useLayoutEffect(() => {
    if (urlLayerOpen) closedKey.current = NOT_CLOSED;
  }, [urlLayerOpen]);
  // Undefined on an entry another router wrote, which TanStack doesn't key.
  const entryKey = location.state.__TSR_key;

  return useCallback(() => {
    // A closed layer's entry is no longer the current one — a mutation can
    // resolve after Back closed its dialog — so navigating would act on the
    // user's current entry instead: Back pops whatever they have open now,
    // and the deep-link branch edits today's URL.
    if (!stillOpen.current) return;
    if (closedKey.current === entryKey) return;
    closedKey.current = entryKey;
    if (pushed) {
      // Popping the entry `open` pushed is what keeps Back working: replacing
      // it would leave two consecutive entries with the same URL, so the first
      // Back press after closing would do nothing visible.
      history.back();
      return;
    }
    // No entry of ours to pop (a deep link, or a replace onto one), so drop
    // its params in place rather than navigating out of the app.
    setSearch(Object.fromEntries(params.map((param) => [param, undefined])), {
      replace: true,
      state: (prev) => {
        const state: Record<string, unknown> = { ...prev };
        stateKeys.forEach((key) => delete state[key]);
        return state;
      },
    });
  }, [entryKey, history, pushed, params, setSearch, stateKeys, stillOpen]);
};
