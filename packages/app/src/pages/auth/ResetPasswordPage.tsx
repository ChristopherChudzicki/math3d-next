import React, { useCallback } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useResetPassword } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import { useToggle } from "@/util/hooks";
import styles from "./styles.module.css";
import { handleErrors } from "./util";
import { BasicDialog } from "./components/BasicDialog";

const schema = yup.object({
  email: yup.string().email().required(),
});

type FormData = yup.InferType<typeof schema>;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const resolver = yupResolver(schema);
  const [pendingSubmit, setPendingSubmit] = useToggle(true);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    getValues,
  } = useForm({ resolver });

  const navigateAway = useCallback(() => {
    navigate("../");
  }, [navigate]);

  const resetPassword = useResetPassword();

  const requestReset = useCallback(
    async (data: FormData) => {
      try {
        await resetPassword.mutateAsync(data, {});
        setPendingSubmit(false);
      } catch (err) {
        handleErrors(data, err, setError);
      }
    },
    [resetPassword, setPendingSubmit, setError],
  );

  const title = pendingSubmit ? "Reset Password" : "Confirmation Required";
  const cancelButton = pendingSubmit ? undefined : null; // null will suppress normal button
  const submitButtonContent = pendingSubmit ? "Reset Password" : "OK";
  const submitHandler = pendingSubmit ? requestReset : navigateAway;
  return (
    <BasicDialog
      title={title}
      open
      onClose={navigateAway}
      onConfirm={handleSubmit(submitHandler)}
      confirmText={submitButtonContent}
      fullWidth
      maxWidth="xs"
      cancelButton={cancelButton}
    >
      {resetPassword.isSuccess ? (
        <Alert severity="success">
          <p>
            To reset your password, please use the link emailed to{" "}
            <span className={styles["email-address"]}>{getValues().email}</span>
            . This email may take a few moments to deliver.
          </p>
        </Alert>
      ) : (
        <form className={styles["form-content"]}>
          <TextField
            label="Email"
            error={!!errors.email?.message}
            helperText={errors.email?.message}
            {...register("email")}
          />
          {errors.root?.message ? (
            <Alert severity="error">{errors.root?.message}</Alert>
          ) : null}
        </form>
      )}
    </BasicDialog>
  );
};

export default ResetPasswordPage;