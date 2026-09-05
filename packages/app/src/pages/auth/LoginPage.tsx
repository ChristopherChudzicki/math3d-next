import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import { ApiError, isApiError, useProviderTokenLogin } from "@math3d/api";
import {
  GOOGLE_CLIENT_ID,
  GoogleSignInButton,
  useAuthStatus,
} from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./styles.module.css";

type LoginFailure = "signups-closed" | "needs-existing-method" | "unknown";

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
        // Two rejections are worth telling apart from a generic failure,
        // because retrying either one can never succeed.
        // 403 from allauth: a first-time provider identity while registration
        // is closed — signup and login are one request (see
        // useProviderTokenLogin), so there is no separate "existing user"
        // signal to distinguish. Any other 403 takes the generic copy.
        // 401: the address already belongs to an account this provider is not
        // linked to. SOCIALACCOUNT_EMAIL_AUTHENTICATION is off, so allauth
        // stops short of a session rather than adopting the account, and the
        // SPA offers no linking flow.
        if (isApiError(err, [403]) && isFromAllauth(err))
          setFailure("signups-closed");
        else if (isApiError(err, [401])) setFailure("needs-existing-method");
        else setFailure("unknown");
      }
    },
    [login, handleClose],
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
        <GoogleSignInButton onCredential={handleCredential} />
        {failure === "signups-closed" && (
          <Alert severity="error">
            Google signed you in, but sign-ups are currently closed and this
            account has not been registered.
          </Alert>
        )}
        {failure === "needs-existing-method" && (
          <Alert severity="error">
            An account already exists for that email address. Sign in the way
            that account was created, then connect Google from your account
            settings.
          </Alert>
        )}
        {failure === "unknown" && (
          <Alert severity="error">
            Google signed you in, but this site could not complete the sign-in.
            Please try again.
          </Alert>
        )}
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
