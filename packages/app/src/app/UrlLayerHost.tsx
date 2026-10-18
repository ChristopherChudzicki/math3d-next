import React from "react";
import { useSearchParams } from "react-router";
import { SIGN_IN_PARAM } from "@/services/overlays/useSignInDialog";
import type { OverlayName } from "@/services/overlays/useOverlay";
import {
  UrlLayer,
  useUrlLayerOpen,
  useUrlLayerSearchParams,
} from "@/services/overlays/UrlLayer";
import { OVERLAYS } from "./overlayRegistry";
import LoginPage from "./pages/auth/LoginPage";

const SignInUrlLayer: React.FC<{ open: boolean }> = ({ open }) => (
  <UrlLayer open={open}>
    <LoginPage open={open} />
  </UrlLayer>
);

/** Sign-in stacked inside an overlay; it closes when the overlay does. */
const NestedSignIn: React.FC = () => {
  const overlayOpen = useUrlLayerOpen();
  return (
    <SignInUrlLayer
      open={useUrlLayerSearchParams().has(SIGN_IN_PARAM) && overlayOpen}
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
const UrlLayerHost: React.FC = () => {
  const [search] = useSearchParams();
  const name = search.get("overlay");
  // Own-property check, so `?overlay=constructor` counts as unknown: it opens
  // nothing and leaves top-level sign-in free to open.
  const activeOverlay = name && Object.hasOwn(OVERLAYS, name) ? name : null;
  return (
    <>
      {OVERLAY_ENTRIES.map(([key, Overlay]) => (
        <UrlLayer key={key} open={activeOverlay === key}>
          <Overlay open={activeOverlay === key}>
            <NestedSignIn />
          </Overlay>
        </UrlLayer>
      ))}
      <SignInUrlLayer open={search.has(SIGN_IN_PARAM) && !activeOverlay} />
    </>
  );
};

export default UrlLayerHost;
