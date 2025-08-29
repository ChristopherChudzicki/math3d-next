import React, { useCallback, useEffect, useId } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useLogin } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStatus } from "@/features/auth";
import Link from "@/util/components/Link";
import { OverallError, setFieldErrors } from "@/util/forms";
import styles from "./styles.module.css";
import BasicDialog from "@/util/components/BasicDialog";

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useAuthStatus();
  const resolver = yupResolver(schema);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({ resolver });

  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const formId = useId();
  const login = useLogin();
  useEffect(() => {
    if (isAuthenticated) {
      navigate("../");
    }
  }, [isAuthenticated, navigate]);
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
            setIsAuthenticated(true);
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
        <Link href="../auth/reset-password">Forgot password?</Link>
        <Link href="../auth/register">Create Account</Link>
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
