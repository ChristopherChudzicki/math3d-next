import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Link from "@/util/components/Link";
import { useActivateUser, useUserMe } from "@math3d/api";
import { useToggle } from "@/util/hooks";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import LoadingSpinner from "@/util/components/LoadingSpinner/LoadingSpinner";
import AppPageLayout from "@/pages/AppPageLayout/AppPageLayout";

const ActivationMessage: React.FC<{ success: boolean; error: boolean }> = ({
  success,
  error,
}) => {
  if (success) {
    return (
      <Alert severity="success">
        Account successfully activated. Please{" "}
        <Link href="/?overlay=login">log in</Link>.
      </Alert>
    );
  }
  if (error) {
    return (
      <Alert severity="error">
        Error: Please check the activation email to ensure the activation link
        was correct.
      </Alert>
    );
  }
  return (
    <div>
      Activating...
      <LoadingSpinner />
    </div>
  );
};

const AccountActivationPage: React.FC = () => {
  const [success, setSuccess] = useToggle(false);
  const navigate = useNavigate();
  const goToLogin = useCallback(() => {
    navigate("/?overlay=login");
  }, [navigate]);
  const [searchParams] = useSearchParams();
  const activateUser = useActivateUser();
  const activateUserMutate = activateUser.mutate;
  const hasFired = useRef(false);

  // Wait for useUserMe to complete so the CSRF cookie is set before POSTing.
  const userMeQuery = useUserMe();
  const csrfReady = userMeQuery.isFetched;

  useEffect(() => {
    if (!csrfReady || hasFired.current) return;
    hasFired.current = true;
    const key = searchParams.get("key") ?? "";
    activateUserMutate(
      { key },
      {
        onSuccess: setSuccess.on,
      },
    );
  }, [csrfReady, activateUserMutate, searchParams, setSuccess]);

  return (
    <AppPageLayout
      title={
        <Typography component="h1" variant="h5">
          Account Activation
        </Typography>
      }
    >
      <ActivationMessage success={success} error={activateUser.isError} />
      <Button disabled={!success} onClick={goToLogin}>
        Go to login
      </Button>
    </AppPageLayout>
  );
};

export default AccountActivationPage;
