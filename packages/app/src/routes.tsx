import React from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router";

import OverlayHost from "@/features/overlays/OverlayHost";
import MainPage from "./pages/MainPage";
import AccountActivationPage from "./pages/auth/ActivationPage";
import ResetPasswordConfirmPage from "./pages/auth/ResetPasswordConfirmPage";
import ScenesList from "./pages/ScenesList/ScenesListPage";
import HelpPage from "./pages/HelpPage/HelpPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import ErrorTrigger from "./pages/ErrorPage/ErrorTrigger";

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
            path: "auth/activate-account",
            element: <AccountActivationPage />,
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
