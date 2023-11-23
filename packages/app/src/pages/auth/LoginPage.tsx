import React, { useCallback } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useLogin } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStatus } from "@/features/auth";
import Alert from "@mui/material/Alert";
import { AxiosError } from "axios";
import styles from "./styles.module.css";
import FormDialog from "./components/FormDialog";

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [_isAuthenticated, setIsAuthenticated] = useAuthStatus();
  const resolver = yupResolver(schema);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver });

  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);
  const login = useLogin();
  return (
    <FormDialog
      title="Login"
      open
      onClose={handleClose}
      onSubmit={handleSubmit(async (data) => {
        await login.mutateAsync(data, {});
        setIsAuthenticated(true);
        handleClose();
      })}
      onReset={reset}
      submitButtonContent="Login"
      fullWidth
      maxWidth="xs"
    >
      <div className={styles["form-content"]}>
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
        {login.isError ? (
          <Alert severity="error">
            {login.error instanceof AxiosError &&
            login.error.response?.status === 400
              ? "Email or password is incorrect."
              : "Something went wrong. Please try again later."}
          </Alert>
        ) : null}
      </div>
    </FormDialog>
  );
};

export default LoginPage;
