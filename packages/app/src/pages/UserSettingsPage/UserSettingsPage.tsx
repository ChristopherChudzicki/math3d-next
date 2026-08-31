import React, { useCallback, useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import DeleteAccountForm from "./DeleteAccountForm";

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
};

const FORM_ID = "delete_account_form";

const UserSettingsPage: React.FC = () => {
  const [disabled, setDisabled] = useState(false);
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // Deleting your account is the only in-dialog action that signs you out, and
  // it flips auth authenticated → unauthenticated. Flag that deliberate case so
  // the redirect below doesn't treat it like a logged-out visitor: it has its
  // own flow (the "Account Deleted" notice + navigate away) that a login
  // redirect would hijack. Set imperatively from the form's submit handler.
  const selfDeleted = useRef(false);
  const handleSelfDelete = useCallback(() => {
    selfDeleted.current = true;
  }, []);

  // Redirect anyone who is unauthenticated *without* deliberately deleting — a
  // hand-typed /?overlay=settings while logged out, or a session that expired
  // mid-dialog — to the login overlay (a switch, so it replaces history).
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
    <Dialog open fullWidth maxWidth="sm" onClose={handleClose}>
      <div style={topRightStyle}>
        <IconButton onClick={handleClose} aria-label="Close">
          <Close />
        </IconButton>
      </div>
      <DialogTitle>Account Settings</DialogTitle>
      <DialogContent>
        <DeleteAccountForm
          id={FORM_ID}
          setDisabled={setDisabled}
          onSelfDelete={handleSelfDelete}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={disabled}
          variant="contained"
          color="error"
          type="submit"
          form={FORM_ID}
        >
          Delete Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserSettingsPage;
