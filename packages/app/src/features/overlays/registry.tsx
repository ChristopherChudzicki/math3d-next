import type React from "react";
import LoginPage from "@/pages/auth/LoginPage";
import LogoutPage from "@/pages/auth/LogoutPage";
import RegistrationPage from "@/pages/auth/RegistrationPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import ResetPasswordConfirmPage from "@/pages/auth/ResetPasswordConfirmPage";
import ActivationPage from "@/pages/auth/ActivationPage";
import UserSettingsPage from "@/pages/UserSettingsPage/UserSettingsPage";
import ScenesListPage from "@/pages/ScenesList/ScenesListPage";
import type { OverlayName } from "./useOverlay";

// Overlay name → component. Unknown values render nothing.
// Typed by OverlayName so the registry and the `open(...)` union can't drift.
export const OVERLAYS: Record<OverlayName, React.FC> = {
  login: LoginPage,
  logout: LogoutPage,
  register: RegistrationPage,
  "reset-request": ResetPasswordPage,
  "reset-confirm": ResetPasswordConfirmPage,
  activate: ActivationPage,
  settings: UserSettingsPage,
  scenes: ScenesListPage,
};
