import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import * as Sentry from "@sentry/react";
import { useProviderTokenLogin } from "@math3d/api";
import Divider from "@mui/material/Divider";
import {
  DummySignInForm,
  ENABLE_DUMMY_AUTH,
  GOOGLE_CLIENT_ID,
  GoogleSignInButton,
  useAuthStatus,
} from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./LoginPage.module.css";

type LoginFailure = "failed" | "script-unavailable";

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;

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
        // One message for every rejection. Each cause needs a configured
        // deployment to be unreachable rather than merely unlikely, so Sentry
        // is where they are told apart — which means capturing all of them,
        // including the ones a user could in principle provoke.
        setFailure("failed");
        Sentry.captureException(err);
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
        {ENABLE_DUMMY_AUTH && (
          <>
            <Divider className={styles["dummy-divider"]}>or</Divider>
            <DummySignInForm />
          </>
        )}
        {failure === "failed" && (
          <Alert severity="error">
            Google signed you in, but this site could not complete the sign-in.
            Please try again, and{" "}
            <Link href={ISSUE_URL} target="_blank" rel="noreferrer">
              get in touch
            </Link>{" "}
            if it keeps happening.
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
