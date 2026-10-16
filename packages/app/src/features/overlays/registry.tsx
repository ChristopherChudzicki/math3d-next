import type React from "react";
import LogoutPage from "@/pages/auth/LogoutPage";
import DeleteAccountPage from "@/pages/auth/DeleteAccountPage";
import ScenesListPage from "@/pages/ScenesList/ScenesListPage";
import type { OverlayName, OverlayProps } from "./useOverlay";

/**
 * Overlay name → component. Unknown values render nothing. Typed by
 * OverlayName so the registry and the `open(...)` union can't drift.
 *
 * Every overlay stays mounted while closed, so each is a shell — `Root`,
 * `Popup`, and only what `Root` itself needs — around a content component
 * inside `Popup` that holds everything else. Content exists only while the
 * overlay is open or closing, so its queries never run while it is closed, and
 * its effects need no `open` check. Content reads the URL through
 * `useUrlLayerSearchParams`/`useUrlLayerLocation`, which hold still while it closes.
 * `useAuthStatus` may sit in a shell: it is session state every route already
 * loads, not overlay data.
 */
export const OVERLAYS: Record<OverlayName, React.FC<OverlayProps>> = {
  logout: LogoutPage,
  "delete-account": DeleteAccountPage,
  scenes: ScenesListPage,
};
