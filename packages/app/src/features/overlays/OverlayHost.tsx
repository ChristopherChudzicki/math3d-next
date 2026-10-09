import React from "react";
import { useSearchParams } from "react-router";
import LoginPage from "@/pages/auth/LoginPage";
import { OVERLAYS } from "./registry";
import { SIGN_IN_PARAM } from "./useSignInDialog";
import type { OverlayName } from "./useOverlay";
import {
  OverlayLayer,
  useLayerOpen,
  useLayerSearchParams,
} from "./OverlayLayer";

const SignInLayer: React.FC<{ open: boolean }> = ({ open }) => (
  <OverlayLayer open={open}>
    <LoginPage open={open} />
  </OverlayLayer>
);

/** Sign-in stacked inside an overlay; it closes when the overlay does. */
const NestedSignIn: React.FC = () => {
  const layerOpen = useLayerOpen();
  return (
    <SignInLayer
      open={useLayerSearchParams().has(SIGN_IN_PARAM) && layerOpen}
    />
  );
};

const OVERLAY_ENTRIES = Object.entries(OVERLAYS) as [
  OverlayName,
  (typeof OVERLAYS)[OverlayName],
][];

/**
 * Renders every overlay, open or not: Base UI animates a dialog in and out
 * only if it is mounted on both sides of the change.
 */
const OverlayHost: React.FC = () => {
  const [search] = useSearchParams();
  const name = search.get("overlay");
  // Own-property check, so `?overlay=constructor` counts as unknown: it opens
  // nothing and leaves top-level sign-in free to open.
  const active = name && Object.hasOwn(OVERLAYS, name) ? name : null;
  return (
    <>
      {OVERLAY_ENTRIES.map(([key, Overlay]) => (
        <OverlayLayer key={key} open={active === key}>
          <Overlay open={active === key}>
            <NestedSignIn />
          </Overlay>
        </OverlayLayer>
      ))}
      <SignInLayer open={search.has(SIGN_IN_PARAM) && !active} />
    </>
  );
};

export default OverlayHost;
