import React, { useCallback, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { useLocation } from "react-router";
import {
  ENABLE_DUMMY_AUTH,
  ProviderSignInButton,
  useAuthStatus,
} from "@/features/auth";
import GoogleLogo from "@/features/auth/GoogleLogo";
import { SIGN_IN_ERROR_MESSAGES } from "@/features/auth/signInErrors";
import type { SignInError } from "@/features/auth/signInErrors";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./LoginPage.module.css";

const LoginPage: React.FC = () => {
  const { close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => close(), [close]);
  const signInError = (
    useLocation().state as { signInError?: SignInError } | null
  )?.signInError;

  useEffect(() => {
    if (isAuthenticated === "authenticated") {
      close();
    }
  }, [isAuthenticated, close]);

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
        <ProviderSignInButton
          provider="google"
          variant="outlined"
          startIcon={<GoogleLogo />}
          className={styles["google-button"]}
        >
          Sign in with Google
        </ProviderSignInButton>
        {signInError && (
          <Alert severity={signInError === "cancelled" ? "info" : "error"}>
            {SIGN_IN_ERROR_MESSAGES[signInError]}
          </Alert>
        )}
        {/* Below the alert: it belongs to the Google button above, and a
            control between the two reads as its owner. */}
        {ENABLE_DUMMY_AUTH && (
          <>
            <Divider className={styles["dummy-divider"]}>or</Divider>
            <ProviderSignInButton provider="dummy" variant="outlined">
              Sign in as dev user
            </ProviderSignInButton>
          </>
        )}
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
