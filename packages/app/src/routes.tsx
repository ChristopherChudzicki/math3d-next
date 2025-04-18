import React from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router";

import MainPage from "./pages/MainPage";
import LoginPage from "./pages/auth/LoginPage";
import LogoutPage from "./pages/auth/LogoutPage";

import RegistrationPage from "./pages/auth/RegistrationPage";
import AccountActivationPage from "./pages/auth/ActivationPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ResetPasswordConfirmPage from "./pages/auth/ResetPasswordConfirmPage";
import ScenesList from "./pages/ScenesList/ScenesListPage";
import UserSettingsPage from "./pages/UserSettingsPage/UserSettingsPage";
import HelpPage from "./pages/HelpPage/HelpPage";

const routes: RouteObject[] = [
  {
    // Saving a slot for errorElement
    children: [
      {
        path: "/help/reference",
        element: <HelpPage />,
      },
      {
        path: "/:sceneKey?",
        element: (
          <>
            <MainPage />
            <Outlet />
          </>
        ),
        children: [
          {
            path: "scenes/:listType",
            element: <ScenesList />,
          },
          {
            path: "auth/login",
            element: <LoginPage />,
          },
          {
            path: "auth/logout",
            element: <LogoutPage />,
          },
          {
            path: "auth/register",
            element: <RegistrationPage />,
          },
          {
            path: "auth/activate-account",
            element: <AccountActivationPage />,
          },
          {
            path: "auth/reset-password",
            element: <ResetPasswordPage />,
          },
          {
            path: "auth/reset-password/confirm",
            element: <ResetPasswordConfirmPage />,
          },
          {
            path: "user/settings",
            element: <UserSettingsPage />,
          },
        ],
      },
    ],
  },
];

export default routes;
