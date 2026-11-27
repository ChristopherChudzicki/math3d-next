import { useCallback } from "react";
import type { SignInError } from "@/services/auth/signInErrorCodes";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import { useCloseUrlLayer } from "./useCloseUrlLayer";
import { useUrlLayerStillOpenRef, useUrlLayerLocation } from "./UrlLayer";

declare module "@tanstack/react-router" {
  interface HistoryState {
    /** Like `overlayPushed`, for the `?signin` entry. */
    signInPushed?: boolean;
    signInError?: SignInError;
  }
}

const PARAMS = ["signin"] as const;
const STATE_KEYS = ["signInPushed", "signInError"] as const;

/**
 * `?signin` opens the sign-in dialog above any `?overlay=`, so the page it
 * returns to after sign-in still has that overlay open.
 */
export const useSignInDialog = () => {
  const location = useUrlLayerLocation();
  const setSearch = useSetSearch();
  const stillOpen = useUrlLayerStillOpenRef();
  const pushed = location.state.signInPushed ?? false;

  /**
   * `replaceOverlay` closes the overlay instead of stacking on it, for an
   * overlay that makes no sense to whoever signs in next.
   */
  const open = useCallback(
    (options?: { replaceOverlay?: boolean }) => {
      // A closed layer's location is stale; see useCloseUrlLayer.
      if (!stillOpen.current) return;
      if (!options?.replaceOverlay) {
        setSearch(
          { signin: "" },
          { state: (prev) => ({ ...prev, signInPushed: true }) },
        );
        return;
      }
      setSearch(
        { signin: "", overlay: undefined, list: undefined },
        {
          // Replaces the overlay's entry, so closing pops it only if it was ours.
          replace: true,
          state: ({ overlayPushed, ...rest }) => ({
            ...rest,
            signInPushed: overlayPushed,
          }),
        },
      );
    },
    [setSearch, stillOpen],
  );

  const close = useCloseUrlLayer({
    pushed,
    params: PARAMS,
    stateKeys: STATE_KEYS,
    location,
    stillOpen,
  });

  return { open, close } as const;
};
