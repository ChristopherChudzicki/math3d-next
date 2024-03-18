import React from "react";
import * as yup from "yup";
import { useUserMe, useUserMeDelete } from "@math3d/api";
import { Alert, TextField } from "@mui/material";
import { useValidatedForm } from "@/util/forms";
import { useAuthStatus } from "@/features/auth";

const CONFIRM_PROMPT = "Yes, permanently delete";

const schema = yup.object({
  confirm: yup.string().required().oneOf([CONFIRM_PROMPT]),
  current_password: yup.string().required().label("Current Password"),
});

const DeleteAccountForm: React.FC<{
  id: string;
  setDisabled: (disabled: boolean) => void;
}> = ({ id, setDisabled }) => {
  const userQuery = useUserMe();
  const [_authenticated, setAuthenticated] = useAuthStatus();
  const deleteAccount = useUserMeDelete();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });

  if (!userQuery.data) return null;

  return (
    <form
      id={id}
      onSubmit={handleSubmit(async (data, event) => {
        if (deleteAccount.isPending) return;
        event?.preventDefault();
        try {
          setDisabled(true);
          await deleteAccount.mutateAsync(data);
          setAuthenticated(false);
          alert("Account deletd!");
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
        error={!!errors.current_password?.message}
        helperText={errors.current_password?.message}
        label="Current Password"
        type="password"
        {...register("current_password")}
      />
      <TextField
        fullWidth
        margin="normal"
        error={!!errors.confirm?.message}
        helperText={`Please type "${CONFIRM_PROMPT}" exactly.`}
        label="Confirm"
        type="text"
        {...register("confirm")}
      />
    </form>
  );
};

export default DeleteAccountForm;
