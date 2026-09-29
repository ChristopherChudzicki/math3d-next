import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

type Layer = {
  /** Whether the app pushed the current history entry to open this layer. */
  pushed: boolean;
  /** Search params the layer owns, dropped when it closes in place. */
  params: readonly string[];
  /** History-state keys the layer owns, dropped when it closes in place. */
  stateKeys: readonly string[];
};

/** Closes a dialog that lives in the URL: `?overlay=`, or `?signin` above it. */
export const useCloseLayer = ({ pushed, params, stateKeys }: Layer) => {
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Consumers close from more than one place — LogoutPage both awaits its
  // mutation and watches auth status — and popping twice would leave the app
  // entirely. Keyed on the entry rather than a bare flag so a later layer
  // still closes, and read through a ref so a stale closure sees it too.
  const closedKey = useRef<string | null>(null);

  // OverlayHost unmounts a layer's component when its param changes, so a
  // consumer's `close` can outlive it — a mutation can resolve after Back
  // unmounted its dialog.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return useCallback(() => {
    // Every entry this closure knows about belongs to a component that is gone,
    // so navigating would act on the user's current one instead: `navigate(-1)`
    // pops the layer they have open now, and the deep-link branch rewrites
    // today's URL from a stale `search`.
    if (!mounted.current) return;
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
  ]);
};
