import { useCallback } from "react";
import { useNavigate } from "react-router";
import type { SignInError } from "@/features/auth/signInErrors";
import { OVERLAY_PARAMS } from "./useOverlay";
import type { OverlayHistoryState } from "./useOverlay";
import { useCloseUrlLayer } from "./useCloseUrlLayer";
import {
  useUrlLayerLiveRef,
  useUrlLayerLocation,
  useUrlLayerSearchParams,
} from "./UrlLayer";

/**
 * `?signin` opens the sign-in dialog above any `?overlay=`, so the page it
 * returns to after sign-in still has that overlay open.
 */
export const SIGN_IN_PARAM = "signin";

export type SignInHistoryState = {
  /** Like `overlayPushed`, for the `?signin` entry. */
  signInPushed?: boolean;
  signInError?: SignInError;
} | null;

const PARAMS = [SIGN_IN_PARAM] as const;
const STATE_KEYS = ["signInPushed", "signInError"] as const;

export const useSignInDialog = () => {
  const search = useUrlLayerSearchParams();
  const location = useUrlLayerLocation();
  const navigate = useNavigate();
  const live = useUrlLayerLiveRef();
  const state = location.state as
    | (SignInHistoryState & OverlayHistoryState)
    | null;
  const pushed = state?.signInPushed ?? false;

  /**
   * `replaceOverlay` closes the overlay instead of stacking on it, for an
   * overlay that makes no sense to whoever signs in next.
   */
  const open = useCallback(
    (options?: { replaceOverlay?: boolean }) => {
      // A closed layer's location is stale; see useCloseUrlLayer.
      if (!live.current) return;
      const next = new URLSearchParams(search);
      next.set(SIGN_IN_PARAM, "");
      if (options?.replaceOverlay) {
        OVERLAY_PARAMS.forEach((param) => next.delete(param));
      }
      const to = { search: next.toString(), hash: location.hash };
      if (!options?.replaceOverlay) {
        navigate(to, { state: { ...state, signInPushed: true } });
        return;
      }
      const { overlayPushed, ...rest } = state ?? {};
      navigate(
        to,
        // Replaces the overlay's entry, so closing pops it only if it was ours.
        { replace: true, state: { ...rest, signInPushed: overlayPushed } },
      );
    },
    [search, location.hash, state, navigate, live],
  );

  const close = useCloseUrlLayer({
    pushed,
    params: PARAMS,
    stateKeys: STATE_KEYS,
    location,
    search,
    live,
  });

  return { open, close } as const;
};
