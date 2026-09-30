import React, { useCallback, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import { useLocation } from "react-router";
import {
  ENABLE_DUMMY_AUTH,
  ProviderSignInButton,
  useAuthStatus,
} from "@/features/auth";
import GoogleLogo from "@/features/auth/GoogleLogo";
import { SIGN_IN_ERROR_MESSAGES } from "@/features/auth/signInErrors";
import BasicDialog from "@/ui/BasicDialog";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import type { SignInHistoryState } from "@/features/overlays/useSignInDialog";
import styles from "./LoginPage.module.css";

const LoginPage: React.FC = () => {
  const { close } = useSignInDialog();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => close(), [close]);
  const signInError = (useLocation().state as SignInHistoryState)?.signInError;

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
        {signInError && (
          <Alert
            severity={signInError === "cancelled" ? "info" : "error"}
            role={signInError === "cancelled" ? "status" : "alert"}
            className={styles["sign-in-alert"]}
          >
            {SIGN_IN_ERROR_MESSAGES[signInError]}
          </Alert>
        )}
        <Typography variant="body2">
          Sign in to save your scenes and find them later in My Scenes. New to
          Math3d? Signing in with Google creates your account.
        </Typography>
        <ProviderSignInButton
          provider="google"
          variant="outlined"
          startIcon={<GoogleLogo />}
          className={styles["google-button"]}
        >
          Sign in with Google
        </ProviderSignInButton>
        {/* Last, so the dialog reads the same with or without this
            dev-only button. */}
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
