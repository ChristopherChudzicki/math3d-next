// Use `react-router` (not `react-router-dom`) to match the repo convention (21 src files).
import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useCloseLayer } from "./useCloseLayer";

export type OverlayName = "logout" | "delete-account" | "scenes";

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
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const current = search.get("overlay");
  const pushed =
    (location.state as OverlayHistoryState)?.overlayPushed ?? false;

  const open = useCallback(
    (name: OverlayName, companion?: { list?: string }) => {
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
    [search, location.hash, location.state, navigate, pushed],
  );

  const close = useCloseLayer({
    pushed,
    params: OVERLAY_PARAMS,
    stateKeys: STATE_KEYS,
  });

  return { current, open, close } as const;
};
