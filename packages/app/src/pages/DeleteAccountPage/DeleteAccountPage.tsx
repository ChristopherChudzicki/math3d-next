import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import BasicDialog from "@/util/components/BasicDialog";
import DeleteAccountForm from "./DeleteAccountForm";

const FORM_ID = "delete_account_form";

const DeleteAccountPage: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // A successful delete flips auth authenticated → unauthenticated. Flag that
  // deliberate case so the redirect below doesn't treat it like a logged-out
  // visitor: it has its own flow (the "Account Deleted" notice + navigate away)
  // that a login redirect would hijack. Set from the form's submit handler.
  const selfDeleted = useRef(false);
  const handleSelfDelete = useCallback(() => {
    selfDeleted.current = true;
  }, []);

  // Redirect anyone who is unauthenticated *without* deliberately deleting — a
  // hand-typed /?overlay=delete-account while logged out, or a session that
  // expired mid-dialog — to the login overlay (a switch, so it replaces
  // history).
  useEffect(() => {
    if (isAuthenticated === "unauthenticated" && !selfDeleted.current) {
      open("login");
    }
  }, [isAuthenticated, open]);

  // Don't mount the form unless we have a user — a cold/expired visitor would
  // otherwise fire requests against a missing account while we redirect. The
  // deliberate self-delete case keeps rendering so its own flow can finish.
  if (isAuthenticated !== "authenticated" && !selfDeleted.current) return null;

  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
      title="Delete Account"
      // The form lives in the dialog body, so the footer button reaches it by
      // id rather than by being inside it.
      confirmButton={
        <Button
          disabled={disabled}
          variant="contained"
          color="error"
          type="submit"
          form={FORM_ID}
        >
          Delete Account
        </Button>
      }
    >
      <DeleteAccountForm
        id={FORM_ID}
        setDisabled={setDisabled}
        onSelfDelete={handleSelfDelete}
      />
    </BasicDialog>
  );
};

export default DeleteAccountPage;
