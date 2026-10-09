import { useCallback, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { useNavigate } from "react-router";
import type { Location } from "react-router";
import { useLayerOpen } from "./UrlLayer";

type Layer = {
  /** Whether the app pushed the current history entry to open this layer. */
  pushed: boolean;
  /** Search params the layer owns, dropped when it closes in place. */
  params: readonly string[];
  /** History-state keys the layer owns, dropped when it closes in place. */
  stateKeys: readonly string[];
  /** The caller's layer location and search params, and its live ref. */
  location: Location;
  search: URLSearchParams;
  live: RefObject<boolean>;
};

/** Closes a dialog that lives in the URL: `?overlay=`, or `?signin` above it. */
export const useCloseLayer = ({
  pushed,
  params,
  stateKeys,
  location,
  search,
  live,
}: Layer) => {
  const navigate = useNavigate();

  // Consumers close from more than one place — LogoutPage both awaits its
  // mutation and watches auth status — and popping twice would leave the app
  // entirely. Keyed on the entry rather than a bare flag so a later layer
  // still closes, and read through a ref so a stale closure sees it too.
  const closedKey = useRef<string | null>(null);
  // Overlays stay mounted while closed, so the guard has to forget a close once
  // the layer reopens: Forward returns to the very entry it recorded.
  const layerOpen = useLayerOpen();
  useLayoutEffect(() => {
    if (layerOpen) closedKey.current = null;
  }, [layerOpen]);

  return useCallback(() => {
    // A closed overlay's entry is no longer the current one — a mutation can
    // resolve after Back closed its dialog — so navigating would act on the
    // user's current entry instead: `navigate(-1)` pops whatever they have
    // open now, and the deep-link branch rewrites today's URL from a stale
    // `search`.
    if (!live.current) return;
    if (closedKey.current === location.key) return;
    closedKey.current = location.key;
    if (pushed) {
      // Popping the entry `open` pushed is what keeps Back working: replacing
      // it would leave two consecutive entries with the same URL, so the first
      // Back press after closing would do nothing visible.
      navigate(-1);
      return;
    }
    // No entry of ours to pop (a deep link, or a replace onto one), so drop
    // its params in place rather than navigating out of the app.
    const next = new URLSearchParams(search);
    params.forEach((param) => next.delete(param));
    const state = { ...(location.state as object | null) } as Record<
      string,
      unknown
    >;
    stateKeys.forEach((key) => delete state[key]);
    navigate(
      { search: next.toString(), hash: location.hash },
      { replace: true, state },
    );
  }, [
    search,
    location.hash,
    location.key,
    location.state,
    navigate,
    pushed,
    params,
    stateKeys,
    live,
  ]);
};
