import React, { useEffect } from "react";
import {
  ENABLE_DUMMY_AUTH,
  ProviderSignInButton,
  useAuthStatus,
} from "@/features/auth";
import GoogleLogo from "@/features/auth/GoogleLogo";
import { SIGN_IN_ERROR_MESSAGES } from "@/features/auth/signInErrors";
import Alert from "@/ui/Alert";
import { Dialog } from "@/ui/Dialog";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import type { SignInHistoryState } from "@/features/overlays/useSignInDialog";
import { useLayerLocation } from "@/features/overlays/UrlLayer";
import styles from "./LoginPage.module.css";

const LoginContent: React.FC<{ close: () => void }> = ({ close }) => {
  const isAuthenticated = useAuthStatus();
  const signInError = (useLayerLocation().state as SignInHistoryState)
    ?.signInError;

  useEffect(() => {
    if (isAuthenticated === "authenticated") {
      close();
    }
  }, [isAuthenticated, close]);

  return (
    <>
      <Dialog.Header>
        <Dialog.Title>Sign in</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body className={styles["sign-in-content"]}>
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
      </Dialog.Body>
    </>
  );
};

/** The sign-in dialog. `open` follows the URL's `?signin` param. */
const LoginPage: React.FC<{ open: boolean }> = ({ open }) => {
  const { close } = useSignInDialog();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) close();
      }}
    >
      <Dialog.Popup size="sm">
        <LoginContent close={close} />
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default LoginPage;
