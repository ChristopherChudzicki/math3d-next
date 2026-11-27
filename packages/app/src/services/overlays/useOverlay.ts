import type React from "react";
import { useCallback } from "react";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import type { ListType, OverlayName } from "./search";
import { useCloseUrlLayer } from "./useCloseUrlLayer";
import { useUrlLayerStillOpenRef, useUrlLayerLocation } from "./UrlLayer";

/**
 * `open` comes from the URL; the overlay stays mounted while closed so it can
 * animate. `children` is a dialog stacked above the overlay, such as sign-in.
 * Render it inside the popup so Base UI nests it; sibling modals each aria-hide
 * the other.
 */
export type OverlayProps = { open: boolean; children?: React.ReactNode };

declare module "@tanstack/react-router" {
  interface HistoryState {
    /**
     * Marks a history entry `open` pushed, so `close` knows to pop it rather
     * than write a second entry with the same URL. A switch replaces, so it
     * inherits the flag from the entry it lands on: that entry may be a deep
     * link the app never pushed, and popping it would leave the app.
     */
    overlayPushed?: boolean;
  }
}

const OVERLAY_PARAMS = ["overlay", "list"] as const;
const STATE_KEYS = ["overlayPushed"] as const;

export const useOverlay = () => {
  const location = useUrlLayerLocation();
  const setSearch = useSetSearch();
  const stillOpen = useUrlLayerStillOpenRef();
  const pushed = location.state.overlayPushed ?? false;
  const switching = location.search.overlay !== undefined;

  const open = useCallback(
    (name: OverlayName, companion?: { list?: ListType }) => {
      // A closed layer's location is stale; see useCloseUrlLayer.
      if (!stillOpen.current) return;
      setSearch(
        { overlay: name, list: companion?.list },
        {
          replace: switching,
          state: (prev) => ({
            ...prev,
            overlayPushed: switching ? pushed : true,
          }),
        },
      );
    },
    [setSearch, switching, pushed, stillOpen],
  );

  const close = useCloseUrlLayer({
    pushed,
    params: OVERLAY_PARAMS,
    stateKeys: STATE_KEYS,
    location,
    stillOpen,
  });

  return { open, close } as const;
};
