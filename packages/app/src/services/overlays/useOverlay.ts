// Use `react-router` (not `react-router-dom`) to match the repo convention (21 src files).
import type React from "react";
import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useCloseUrlLayer } from "./useCloseUrlLayer";
import {
  useUrlLayerStillOpenRef,
  useUrlLayerLocation,
  useUrlLayerSearchParams,
} from "./UrlLayer";

export type OverlayName = "logout" | "delete-account" | "scenes";

/**
 * `open` comes from the URL; the overlay stays mounted while closed so it can
 * animate. `children` is a dialog stacked above the overlay, such as sign-in.
 * Render it inside the popup so Base UI nests it; sibling modals each aria-hide
 * the other.
 */
export type OverlayProps = { open: boolean; children?: React.ReactNode };

/**
 * Marks a history entry `open` pushed, so `close` knows to pop it rather than
 * write a second entry with the same URL. A switch replaces, so it inherits the
 * flag from the entry it lands on: that entry may be a deep link the app never
 * pushed, and popping it would leave the app.
 */
export type OverlayHistoryState = { overlayPushed?: boolean } | null;

export const OVERLAY_PARAMS = ["overlay", "list"] as const;
const STATE_KEYS = ["overlayPushed"] as const;

export const useOverlay = () => {
  const search = useUrlLayerSearchParams();
  const location = useUrlLayerLocation();
  const navigate = useNavigate();
  const stillOpen = useUrlLayerStillOpenRef();
  const pushed =
    (location.state as OverlayHistoryState)?.overlayPushed ?? false;

  const open = useCallback(
    (name: OverlayName, companion?: { list?: string }) => {
      // A closed layer's location is stale; see useCloseUrlLayer.
      if (!stillOpen.current) return;
      const next = new URLSearchParams(search);
      const switching = next.has("overlay");
      next.set("overlay", name);
      next.delete("list");
      if (companion?.list) next.set("list", companion.list);
      navigate(
        { search: next.toString(), hash: location.hash },
        {
          replace: switching,
          state: {
            ...(location.state as object),
            overlayPushed: switching ? pushed : true,
          },
        },
      );
    },
    [search, location.hash, location.state, navigate, pushed, stillOpen],
  );

  const close = useCloseUrlLayer({
    pushed,
    params: OVERLAY_PARAMS,
    stateKeys: STATE_KEYS,
    location,
    search,
    stillOpen,
  });

  return { open, close } as const;
};
