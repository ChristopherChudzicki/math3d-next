import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import { useProviderTokenLogin } from "@math3d/api";
import {
  GOOGLE_CLIENT_ID,
  GoogleSignInButton,
  useAuthStatus,
} from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./styles.module.css";

const LoginPage: React.FC = () => {
  const { close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => close(), [close]);
  const login = useProviderTokenLogin();
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    if (isAuthenticated === "authenticated") {
      close();
    }
  }, [isAuthenticated, close]);

  const handleCredential = useCallback(
    async (credential: string) => {
      setRejected(false);
      try {
        await login.mutateAsync({
          provider: "google",
          client_id: GOOGLE_CLIENT_ID,
          id_token: credential,
        });
        // mutateAsync awaits onSuccess, which resets queries (including
        // useUserMe), so auth status is already up-to-date.
        handleClose();
      } catch {
        setRejected(true);
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
        {rejected && (
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
