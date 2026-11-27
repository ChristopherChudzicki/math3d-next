import React from "react";
import { Outlet } from "@tanstack/react-router";
import SignInErrorHandler from "@/features/auth/SignInErrorHandler";
import UrlLayerHost from "./UrlLayerHost";
import ErrorTrigger from "./pages/ErrorPage/ErrorTrigger";

/**
 * Hosts the `?test-sync-error` trigger, the sign-in `?error=` handler and the
 * URL's dialogs on every route, around the matched child.
 */
const RootLayout: React.FC = () => (
  <>
    <ErrorTrigger />
    <SignInErrorHandler />
    <Outlet />
    <UrlLayerHost />
  </>
);

export default RootLayout;
