import React from "react";
import * as yup from "yup";
import { useUpdatePassword } from "@math3d/api";
import { Alert, TextField } from "@mui/material";
import { OverallError, useValidatedForm } from "@/util/forms";

const schema = yup.object({
  current_password: yup.string().label("Current Password").required(),
  new_password: yup.string().label("New Password").required(),
  re_new_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "New passwords must match")
    .required("Must confirm new password"),
});

const ChangePasswordForm: React.FC<{
  id: string;
  setDisabled: (disabled: boolean) => void;
}> = ({ id, setDisabled }) => {
  const updatePassword = useUpdatePassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useValidatedForm({ schema });

  return (
    <form
      id={id}
      onSubmit={handleSubmit(async (data, event) => {
        if (updatePassword.isPending) return;
        event?.preventDefault();
        try {
          setDisabled(true);
          // Send only the fields allauth expects (no re_new_password)
          const { current_password, new_password } = data;
          await updatePassword.mutateAsync({ current_password, new_password });
        } finally {
          setDisabled(false);
        }
      })}
    >
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
        error={!!errors.new_password?.message}
        helperText={errors.new_password?.message}
        label="New Password"
        type="password"
        {...register("new_password")}
      />
      <TextField
        fullWidth
        margin="normal"
        error={!!errors.re_new_password?.message}
        helperText={errors.re_new_password?.message}
        label="Confirm New Password"
        type="password"
        {...register("re_new_password")}
      />
      <OverallError />
      {updatePassword.isSuccess && (
        <Alert severity="success">Password changed successfully.</Alert>
      )}
    </form>
  );
};

export default ChangePasswordForm;
