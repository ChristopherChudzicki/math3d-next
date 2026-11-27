import React from "react";
import { useLocation } from "@tanstack/react-router";
import type { OverlayName } from "@/services/overlays/search";
import {
  UrlLayer,
  useUrlLayerLocation,
  useUrlLayerOpen,
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
      open={useUrlLayerLocation().search.signin !== undefined && overlayOpen}
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
  const { search } = useLocation();
  const activeOverlay = search.overlay ?? null;
  return (
    <>
      {OVERLAY_ENTRIES.map(([key, Overlay]) => (
        <UrlLayer key={key} open={activeOverlay === key}>
          <Overlay open={activeOverlay === key}>
            <NestedSignIn />
          </Overlay>
        </UrlLayer>
      ))}
      <SignInUrlLayer open={search.signin !== undefined && !activeOverlay} />
    </>
  );
};

export default UrlLayerHost;
