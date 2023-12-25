import React, { useCallback, useId } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useResetPasswordConfirm } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import Link from "@/util/components/Link";
import styles from "./styles.module.css";
import { handleErrors } from "./util";
import { BasicDialog } from "./components/BasicDialog";

const schema = yup.object({
  new_password: yup.string().min(9).label("Password").required(),
  re_new_password: yup
    .string()
    .oneOf([yup.ref("new_password")], "Passwords must match")
    .required("Must confirm password"),
  uid: yup.string().required(),
  token: yup.string().required(),
});

type FormData = yup.InferType<typeof schema>;

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const formId = useId();

  const resolver = yupResolver(schema);
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver,
    defaultValues: {
      uid: searchParams.get("uid") ?? "",
      token: searchParams.get("token") ?? "",
    },
  });

  const navigateAway = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const resetPassword = useResetPasswordConfirm();
  const changePassword = useCallback(
    async (data: FormData) => {
      try {
        await resetPassword.mutateAsync(data);
      } catch (err) {
        handleErrors(data, err, setError);
      }
    },
    [resetPassword, setError],
  );
  const goToLogin = useCallback(() => navigate("/auth/login"), [navigate]);

  const cancelButton = resetPassword.isSuccess ? null : undefined; // null will suppress normal button
  const submitButtonContent = resetPassword.isSuccess
    ? "Go to login"
    : "Change Password";
  const submitHandler = resetPassword.isSuccess ? goToLogin : changePassword;
  return (
    <BasicDialog
      title="Change Password"
      open
      onClose={navigateAway}
      onConfirm={handleSubmit(submitHandler)}
      cancelButton={cancelButton}
      confirmText={submitButtonContent}
      fullWidth
      confirmButtonProps={{ form: formId }}
      maxWidth="xs"
    >
      {resetPassword.isSuccess ? (
        <Alert severity="success">
          Password changed. Please <Link to="../auth/login">log in</Link>.
        </Alert>
      ) : (
        <form id={formId} className={styles["form-content"]}>
          <TextField
            error={!!errors.new_password?.message}
            helperText={errors.new_password?.message}
            label="New Password"
            type="password"
            {...register("new_password")}
          />
          <TextField
            error={!!errors.re_new_password?.message}
            helperText={errors.re_new_password?.message}
            label="Confirm New Password"
            type="password"
            {...register("re_new_password")}
          />
          {errors.root?.message ? (
            <Alert severity="error">{errors.root?.message}</Alert>
          ) : null}
          {errors.token || errors.uid ? (
            <Alert severity="error">
              Error: Please check that the password reset link is correct.
            </Alert>
          ) : null}
        </form>
      )}
    </BasicDialog>
  );
};

export default RegistrationPage;
