import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Link from "@/util/components/Link";
import { useActivateUser, useUserMe } from "@math3d/api";
import { useToggle } from "@/util/hooks";
import Alert from "@mui/material/Alert";
import LoadingSpinner from "@/util/components/LoadingSpinner/LoadingSpinner";
import BasicDialog from "@/util/components/BasicDialog";

const ActivationMessage: React.FC<{ success: boolean; error: boolean }> = ({
  success,
  error,
}) => {
  if (success) {
    return (
      <Alert severity="success">
        Account successfully activated. Please{" "}
        <Link href="../auth/login">log in</Link>.
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
  const handleClose = useCallback(() => {
    navigate("../auth/login");
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
    <BasicDialog
      title="Account Activation"
      open
      fullWidth
      maxWidth="xs"
      cancelButton={null}
      onClose={handleClose}
      onConfirm={handleClose}
      confirmButtonProps={{ disabled: !success }}
      confirmText="Go to login"
    >
      <ActivationMessage success={success} error={activateUser.isError} />
    </BasicDialog>
  );
};

export default AccountActivationPage;
