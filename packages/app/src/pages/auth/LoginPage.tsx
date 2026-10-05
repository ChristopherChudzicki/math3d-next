import React, { useCallback, useEffect } from "react";
import { useLocation } from "react-router";
import {
  ENABLE_DUMMY_AUTH,
  ProviderSignInButton,
  useAuthStatus,
} from "@/features/auth";
import GoogleLogo from "@/features/auth/GoogleLogo";
import { SIGN_IN_ERROR_MESSAGES } from "@/features/auth/signInErrors";
import Alert from "@/ui/Alert";
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
            className={styles["sign-in-alert"]}
          >
            {SIGN_IN_ERROR_MESSAGES[signInError]}
          </Alert>
        )}
        <p className={styles.intro}>
          Sign in to save your scenes and find them later in My Scenes. New to
          Math3d? Signing in with Google creates your account.
        </p>
        <ProviderSignInButton
          provider="google"
          className={styles["google-button"]}
        >
          <GoogleLogo />
          Sign in with Google
        </ProviderSignInButton>
        {/* Last, so the dialog reads the same with or without this
            dev-only button. */}
        {ENABLE_DUMMY_AUTH && (
          <>
            <div className={styles["dummy-divider"]}>or</div>
            <ProviderSignInButton provider="dummy">
              Sign in as dev user
            </ProviderSignInButton>
          </>
        )}
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
