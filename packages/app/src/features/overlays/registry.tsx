import type React from "react";
import LoginPage from "@/pages/auth/LoginPage";
import LogoutPage from "@/pages/auth/LogoutPage";
import DeleteAccountPage from "@/pages/DeleteAccountPage/DeleteAccountPage";
import ScenesListPage from "@/pages/ScenesList/ScenesListPage";
import type { OverlayName } from "./useOverlay";

// Overlay name → component. Unknown values render nothing.
// Typed by OverlayName so the registry and the `open(...)` union can't drift.
export const OVERLAYS: Record<OverlayName, React.FC> = {
  login: LoginPage,
  logout: LogoutPage,
  "delete-account": DeleteAccountPage,
  scenes: ScenesListPage,
};
