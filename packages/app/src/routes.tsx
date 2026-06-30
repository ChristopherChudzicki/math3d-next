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
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import ErrorTrigger from "./pages/ErrorPage/ErrorTrigger";
import OverlayHost from "@/features/overlays/OverlayHost";

/**
 * Root layout: hosts the `?test-sync-error` trigger on every route (see ErrorTrigger)
 * and renders the matched child. Its own `errorElement` catches render errors
 * from anywhere in the tree.
 */
const RootLayout: React.FC = () => (
  <>
    <ErrorTrigger />
    <Outlet />
    <OverlayHost />
  </>
);

const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
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
