import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import { isApiError, useProviderTokenLogin } from "@math3d/api";
import {
  GOOGLE_CLIENT_ID,
  GoogleSignInButton,
  useAuthStatus,
} from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./styles.module.css";

type LoginFailure = "signups-closed" | "unknown";

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
        // allauth returns 403 for a first-time provider identity while
        // registration is closed: signup and login are one request (see
        // useProviderTokenLogin), so there is no separate "existing user"
        // signal to tell this apart from any other rejected sign-in.
        setFailure(isApiError(err, [403]) ? "signups-closed" : "unknown");
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
