import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import * as Sentry from "@sentry/react";
import { ApiError, isApiError, useProviderTokenLogin } from "@math3d/api";
import {
  GOOGLE_CLIENT_ID,
  GoogleSignInButton,
  useAuthStatus,
} from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./LoginPage.module.css";

type LoginFailure =
  | "signups-closed"
  | "needs-existing-method"
  | "rejected"
  | "unknown"
  | "script-unavailable";

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;

// allauth answers in JSON. Django's CSRF middleware rejects in HTML, from in
// front of allauth, with the same 403 — so the content type is what says whose
// verdict this is.
const isFromAllauth = (err: ApiError): boolean =>
  err.response.headers.get("content-type")?.includes("application/json") ??
  false;

const LoginPage: React.FC = () => {
  const { close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => close(), [close]);
  const login = useProviderTokenLogin();
  const [failure, setFailure] = useState<LoginFailure | null>(null);

  useEffect(() => {
    if (isAuthenticated === "authenticated") {
      close();
    }
  }, [isAuthenticated, close]);

  const handleCredential = useCallback(
    async (credential: string) => {
      setFailure(null);
      try {
        await login.mutateAsync({
          provider: "google",
          client_id: GOOGLE_CLIENT_ID,
          id_token: credential,
        });
        // mutateAsync awaits onSuccess, which resets queries (including
        // useUserMe), so auth status is already up-to-date.
        handleClose();
      } catch (err) {
        // Three rejections are worth telling apart from a generic failure,
        // because retrying none of them can succeed.
        // 403 from allauth: a first-time provider identity while registration
        // is closed — signup and login are one request (see
        // useProviderTokenLogin), so there is no separate "existing user"
        // signal to distinguish. Any other 403 takes the generic copy.
        // 401: the address already belongs to an account this provider is not
        // linked to. SOCIALACCOUNT_EMAIL_AUTHENTICATION is off, so allauth
        // stops short of a session rather than adopting the account, and the
        // SPA offers no linking flow.
        // 400: allauth rejected the credential itself. A GOOGLE_CLIENT_ID that
        // disagrees with VITE_GOOGLE_CLIENT_ID lands here as `invalid_token`,
        // and no user action clears it.
        if (isApiError(err, [403]) && isFromAllauth(err)) {
          setFailure("signups-closed");
        } else if (isApiError(err, [401])) {
          setFailure("needs-existing-method");
        } else if (isApiError(err, [400])) {
          setFailure("rejected");
          Sentry.captureException(err);
        } else {
          // A 500, a 429, or Django's CSRF 403 — all of which the copy invites
          // the user to retry, so nothing else would record them.
          setFailure("unknown");
          Sentry.captureException(err);
        }
      }
    },
    [login, handleClose],
  );

  const handleUnavailable = useCallback(
    () => setFailure("script-unavailable"),
    [],
  );

  return (
    <BasicDialog
      title="Sign in"
      open
      onClose={handleClose}
      confirmButton={null}
      fullWidth
      maxWidth="xs"
    >
      <div className={styles["sign-in-content"]}>
        <GoogleSignInButton
          onCredential={handleCredential}
          onUnavailable={handleUnavailable}
        />
        {failure === "signups-closed" && (
          <Alert severity="error">
            Google signed you in, but sign-ups are currently closed and this
            account has not been registered.
          </Alert>
        )}
        {failure === "needs-existing-method" && (
          <Alert severity="error">
            That email address belongs to an account that is not connected to
            Google, so it cannot be used to sign in.{" "}
            <Link href={ISSUE_URL} target="_blank" rel="noreferrer">
              Get in touch
            </Link>{" "}
            if you need access to it.
          </Alert>
        )}
        {failure === "rejected" && (
          <Alert severity="error">
            Google signed you in, but this site rejected the credential — a
            problem with this site&apos;s configuration rather than with your
            account, so trying again will not help.{" "}
            <Link href={ISSUE_URL} target="_blank" rel="noreferrer">
              Get in touch
            </Link>{" "}
            so we can fix it.
          </Alert>
        )}
        {failure === "unknown" && (
          <Alert severity="error">
            Google signed you in, but this site could not complete the sign-in.
            Please try again.
          </Alert>
        )}
        {failure === "script-unavailable" && (
          <Alert severity="error">
            Could not load Google sign-in. A content blocker or network problem
            may be stopping it — allow accounts.google.com, then reload.
          </Alert>
        )}
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
