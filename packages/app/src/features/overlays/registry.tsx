import type React from "react";
import LoginPage from "@/pages/auth/LoginPage";
import RegistrationPage from "@/pages/auth/RegistrationPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

// Overlay name → component. Unknown values render nothing.
export const OVERLAYS: Record<string, React.FC> = {
  login: LoginPage,
  register: RegistrationPage,
  "reset-request": ResetPasswordPage,
};
