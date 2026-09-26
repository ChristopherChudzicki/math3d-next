import React from "react";
import type { RouteObject } from "react-router";
import { Outlet } from "react-router";

import OverlayHost from "@/features/overlays/OverlayHost";
import SignInErrorHandler from "@/features/auth/SignInErrorHandler";
import MainPage from "./pages/MainPage";
import FramePage from "./pages/FramePage/FramePage";
import HelpPage from "./pages/HelpPage/HelpPage";
import ErrorPage from "./pages/ErrorPage/ErrorPage";
import ErrorTrigger from "./pages/ErrorPage/ErrorTrigger";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import SignInErrorPage from "./pages/auth/SignInErrorPage";

/**
 * Root layout: hosts the `?test-sync-error` trigger and the sign-in `?error=`
 * handler on every route, and renders the matched child. Its own `errorElement` catches render errors
 * from anywhere in the tree.
 */
const RootLayout: React.FC = () => (
  <>
    <ErrorTrigger />
    <SignInErrorHandler />
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
        path: "app",
        children: [
          { index: true, element: <NotFoundPage /> },
          { path: "help/reference", element: <HelpPage /> },
          // Scene-only render page for headless screenshots. Lives under /app/
          // (the non-scene-key namespace) so it can't be mistaken for a scene.
          { path: "frame/:sceneKey", element: <FramePage /> },
          { path: "sign-in-error", element: <SignInErrorPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
      {
        path: "/:sceneKey?",
        element: <MainPage />,
      },
      // ROOT-level catch-all: any path that is neither `/app/...` nor a single-segment
      // scene key (e.g. a 2+ segment `/.well-known/foo`) renders the soft-404 NotFound.
      // Without this, an unmatched path throws a 404 that the errorElement (ErrorPage)
      // would render as the scary "something broke" view — wrong for a benign mistyped URL.
      // `/:sceneKey?` only matches a single optional segment, so multi-segment junk falls here.
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export default routes;
