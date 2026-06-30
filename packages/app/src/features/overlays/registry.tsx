import type React from "react";
import LoginPage from "@/pages/auth/LoginPage";
import LogoutPage from "@/pages/auth/LogoutPage";
import RegistrationPage from "@/pages/auth/RegistrationPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import UserSettingsPage from "@/pages/UserSettingsPage/UserSettingsPage";
import ScenesListPage from "@/pages/ScenesList/ScenesListPage";

// Overlay name → component. Unknown values render nothing.
export const OVERLAYS: Record<string, React.FC> = {
  login: LoginPage,
  logout: LogoutPage,
  register: RegistrationPage,
  "reset-request": ResetPasswordPage,
  settings: UserSettingsPage,
  scenes: ScenesListPage,
};
