// Use `react-router` (not `react-router-dom`) to match the repo convention (21 src files).
import { useCallback, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

export type OverlayName = "login" | "logout" | "delete-account" | "scenes";

/**
 * Marks a history entry `open` pushed, so `close` knows to pop it rather than
 * write a second entry with the same URL. A switch replaces, so it inherits the
 * flag from the entry it lands on: that entry may be a deep link the app never
 * pushed, and popping it would leave the app.
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
          state: {
            ...(location.state as object),
            overlayPushed: switching ? pushed : true,
          },
        },
      );
    },
    [search, location.hash, location.state, navigate, pushed],
  );

  // Consumers close from more than one place — LogoutPage both awaits its
  // mutation and watches auth status — and popping twice would leave the app
  // entirely. Keyed on the entry rather than a bare flag so a later overlay
  // still closes, and read through a ref so a stale closure sees it too.
  const closedKey = useRef<string | null>(null);

  const close = useCallback(() => {
    if (closedKey.current === location.key) return;
    closedKey.current = location.key;
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
  }, [search, location.hash, location.key, navigate, pushed]);

  return { current, open, close } as const;
};
