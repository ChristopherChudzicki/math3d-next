// Use `react-router` (not `react-router-dom`) to match the repo convention (21 src files).
import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

export type OverlayName = "login" | "logout" | "delete-account" | "scenes";

/**
 * Marks a history entry `open` pushed, so `close` knows to pop it rather than
 * write a second entry with the same URL. Set on a switch too: switching
 * replaces, so the pair still occupies the one entry `open` pushed.
 */
type OverlayHistoryState = { overlayPushed?: boolean } | null;

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
          state: { ...(location.state as object), overlayPushed: true },
        },
      );
    },
    [search, location.hash, location.state, navigate],
  );

  const close = useCallback(() => {
    if (pushed) {
      // Popping the entry `open` pushed is what keeps Back working: replacing
      // it would leave two consecutive entries with the same URL, so the first
      // Back press after signing in would do nothing visible.
      navigate(-1);
      return;
    }
    // No entry of ours to pop — the overlay was deep-linked — so drop the
    // params in place rather than navigating out of the app.
    const next = new URLSearchParams(search);
    next.delete("overlay");
    next.delete("list");
    navigate(
      { search: next.toString(), hash: location.hash },
      { replace: true },
    );
  }, [search, location.hash, navigate, pushed]);

  return { current, open, close } as const;
};
