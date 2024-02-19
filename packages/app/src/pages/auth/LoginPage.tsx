import React, { useCallback, useEffect } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useLogin } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStatus } from "@/features/auth";
import Alert from "@mui/material/Alert";
import Link from "@/util/components/Link";
import styles from "./styles.module.css";
import { handleErrors } from "./util";
import { BasicDialog } from "./components/BasicDialog";

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
      onConfirm={handleSubmit(async (data) => {
        try {
          await login.mutateAsync(data, {});
          setIsAuthenticated(true);
          handleClose();
        } catch (err) {
          handleErrors(data, err, setError);
        }
      })}
      confirmText="Sign in"
      fullWidth
      maxWidth="xs"
    >
      <form className={styles["form-content"]}>
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
        {errors.root?.message ? (
          <Alert severity="error">{errors.root?.message}</Alert>
        ) : null}
      </form>
      <div className={styles["sign-in-footer"]}>
        <Link href="../auth/reset-password">Forgot password?</Link>
        <Link href="../auth/register">Create Account</Link>
      </div>
    </BasicDialog>
  );
};

export default LoginPage;
