import React, { useCallback, useEffect, useId } from "react";
import * as yup from "yup";
import { Alert, TextField } from "@mui/material";
import { useNavigate } from "react-router";
import { useUserMeDelete } from "@math3d/api";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import BasicDialog from "@/util/components/BasicDialog";
import { useValidatedForm } from "@/util/forms";
import { useNotifications } from "@/features/notifications/NotificationsContext";

const CONFIRM_PROMPT = "Yes, permanently delete";

const schema = yup.object({
  confirm: yup.string().required().oneOf([CONFIRM_PROMPT]),
});

const DeleteAccountPage: React.FC = () => {
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const deleteAccount = useUserMeDelete();
  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();
  const formId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // A successful delete flips auth authenticated → unauthenticated, and that
  // deliberate case has its own flow (the "Account Deleted" notice, then
  // navigate away) which a login redirect would hijack. Anyone else who is
  // unauthenticated here — a hand-typed /?overlay=delete-account while logged
  // out, or a session that expired mid-dialog — goes to the login overlay.
  useEffect(() => {
    if (isAuthenticated === "unauthenticated" && !deleteAccount.isSuccess) {
      open("login");
    }
  }, [isAuthenticated, open, deleteAccount.isSuccess]);

  const onSubmit = handleSubmit(async () => {
    await deleteAccount.mutateAsync();
    // mutateAsync awaits onSuccess, which resets queries, so auth status is
    // already up-to-date.
    addNotification({
      title: "Account Deleted",
      body: "Your account has been deleted.",
      type: "alert",
    });
    navigate("/");
  });

  // Without a session there is no account to delete, and firing the request
  // anyway would race the redirect above.
  if (isAuthenticated !== "authenticated" && !deleteAccount.isSuccess) {
    return null;
  }

  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
      title="Delete Account"
      confirmText="Delete Account"
      // The form is in the dialog body, so the footer button reaches it by id.
      confirmButtonProps={{
        type: "submit",
        form: formId,
        color: "error",
        disabled: deleteAccount.isPending || deleteAccount.isSuccess,
      }}
    >
      <form id={formId} onSubmit={onSubmit}>
        <Alert severity="error">
          This action cannot be undone. Scenes you have saved stay published at
          their existing links, with no account able to edit or remove them —
          delete them from <strong>My Scenes</strong> first if you don&rsquo;t
          want that. To confirm, type &ldquo;<code>{CONFIRM_PROMPT}</code>
          &rdquo; exactly.
        </Alert>
        <TextField
          fullWidth
          margin="normal"
          error={!!errors.confirm?.message}
          helperText={`To proceed, enter "${CONFIRM_PROMPT}" exactly.`}
          label="Confirm"
          type="text"
          {...register("confirm")}
        />
        {errors.root?.message ? (
          <Alert severity="error">{errors.root.message}</Alert>
        ) : null}
      </form>
    </BasicDialog>
  );
};

export default DeleteAccountPage;
