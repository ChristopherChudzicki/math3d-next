import React, { useCallback, useEffect, useId } from "react";
import TextField from "@mui/material/TextField";
import MuiLink from "@mui/material/Link";
import { useForm } from "react-hook-form";
import { useLogin } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStatus } from "@/features/auth";
import { OverallError, setFieldErrors } from "@/util/forms";
import BasicDialog from "@/util/components/BasicDialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import styles from "./styles.module.css";

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const LoginPage: React.FC = () => {
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const resolver = yupResolver(schema);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver });

  const handleClose = useCallback(() => close(), [close]);
  const formId = useId();
  const login = useLogin();
  useEffect(() => {
    if (isAuthenticated === "authenticated") {
      close();
    }
  }, [isAuthenticated, close]);
  return (
    <BasicDialog
      title="Sign in"
      open
      onClose={handleClose}
      confirmText="Sign in"
      confirmButtonProps={{ type: "submit", form: formId }}
      fullWidth
      maxWidth="xs"
    >
      <form
        className={styles["form-content"]}
        id={formId}
        onSubmit={handleSubmit(async (data, event) => {
          event?.preventDefault();
          try {
            await login.mutateAsync(data, {});
            // mutateAsync awaits onSuccess which resets queries (including
            // useUserMe), so auth status is already up-to-date.
            handleClose();
          } catch (err) {
            setFieldErrors(data, err, setError);
          }
        })}
      >
        <TextField
          label="Email"
          error={!!errors.email?.message}
          helperText={errors.email?.message}
          {...register("email")}
        />
        <TextField
          error={!!errors.password?.message}
          helperText={errors.password?.message}
          label="Password"
          type="password"
          {...register("password")}
        />
        <OverallError error={errors.root} />
      </form>
      <div className={styles["sign-in-footer"]}>
        <MuiLink
          component="button"
          type="button"
          onClick={() => open("reset-request")}
        >
          Forgot password?
        </MuiLink>
        <MuiLink
          component="button"
          type="button"
          onClick={() => open("register")}
        >
          Create Account
        </MuiLink>
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
