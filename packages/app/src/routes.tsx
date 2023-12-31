import React from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router-dom";

import MainPage from "./pages/MainPage";
import LoginPage from "./pages/auth/LoginPage";
import LogoutPage from "./pages/auth/LogoutPage";

import RegistrationPage from "./pages/auth/RegistrationPage";
import AccountActivationPage from "./pages/auth/ActivationPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ResetPasswordConfirmPage from "./pages/auth/ResetPasswordConfirmPage";
import ScenesList from "./pages/ScenesList/ScenesList";

const routes: RouteObject[] = [
  {
    // Saving a slot for errorElement
    children: [
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
            path: "scenes/examples",
            element: <ScenesList initialTab="examples" />,
          },
          {
            path: "scenes/me",
            element: <ScenesList initialTab="my-scenes" />,
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
        ],
      },
    ],
  },
];

export default routes;
