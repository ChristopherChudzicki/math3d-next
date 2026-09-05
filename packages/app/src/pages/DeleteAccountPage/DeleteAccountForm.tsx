import React from "react";
import * as yup from "yup";
import { useUserMe, useUserMeDelete } from "@math3d/api";
import { Alert, TextField } from "@mui/material";
import { useValidatedForm } from "@/util/forms";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import { useNavigate } from "react-router";

const CONFIRM_PROMPT = "Yes, permanently delete";

const schema = yup.object({
  confirm: yup.string().required().oneOf([CONFIRM_PROMPT]),
});

const DeleteAccountForm: React.FC<{
  id: string;
  setDisabled: (disabled: boolean) => void;
  /**
   * Called when the user submits deletion, so the dialog knows the coming
   * sign-out is deliberate and skips the login redirect.
   */
  onSelfDelete: () => void;
}> = ({ id, setDisabled, onSelfDelete }) => {
  const userQuery = useUserMe();
  const deleteAccount = useUserMeDelete();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });
  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();

  if (!userQuery.data) return null;

  return (
    <form
      id={id}
      onSubmit={handleSubmit(async (_data, event) => {
        if (deleteAccount.isPending) return;
        event?.preventDefault();
        // Signal before the mutation: its onSuccess resets the me-query, which
        // flips auth to unauthenticated — the flag must already be set so the
        // dialog's redirect guard treats this sign-out as deliberate. Harmless
        // if the delete then fails (only matters while unauthenticated).
        onSelfDelete();
        try {
          setDisabled(true);
          await deleteAccount.mutateAsync();
          // mutateAsync awaits onSuccess which resets queries, so auth
          // status is already up-to-date.
          addNotification({
            title: "Account Deleted",
            body: "Your account has been deleted.",
            type: "alert",
          });
          navigate("/");
        } finally {
          setDisabled(false);
        }
      })}
    >
      <Alert severity="error">
        This action cannot be undone. To confirm, type &ldquo;
        <code>{CONFIRM_PROMPT}</code>&rdquo; exactly.
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
    </form>
  );
};

export default DeleteAccountForm;
