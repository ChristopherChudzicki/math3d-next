import React, { useCallback } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useResetPasswordConfirm } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Link from "@/util/components/Link";
import { setFieldErrors } from "@/util/forms";
import AppPageLayout from "@/pages/AppPageLayout/AppPageLayout";
import styles from "./styles.module.css";

const schema = yup.object({
  password: yup.string().min(9).label("Password").required(),
  re_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Must confirm password"),
  key: yup.string().required(),
});

type FormData = yup.InferType<typeof schema>;

const ResetPasswordConfirmPage: React.FC = () => {
  const navigate = useNavigate();

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
      key: searchParams.get("key") ?? "",
    },
  });

  const resetPassword = useResetPasswordConfirm();
  const changePassword: SubmitHandler<FormData> = useCallback(
    async (data, event) => {
      event?.preventDefault();
      try {
        // Send only the fields allauth expects (no re_password)
        const { key, password } = data;
        await resetPassword.mutateAsync({ key, password });
      } catch (err) {
        setFieldErrors(data, err, setError);
      }
    },
    [resetPassword, setError],
  );
  const goToLogin = useCallback(() => navigate("/?overlay=login"), [navigate]);

  return (
    <AppPageLayout
      title={
        <Typography component="h1" variant="h5">
          Change Password
        </Typography>
      }
    >
      {resetPassword.isSuccess ? (
        <>
          <Alert severity="success">
            Password changed. Please <Link href="/?overlay=login">log in</Link>.
          </Alert>
          <Button onClick={goToLogin}>Go to login</Button>
        </>
      ) : (
        <form
          className={styles["form-content"]}
          onSubmit={handleSubmit(changePassword)}
        >
          <TextField
            error={!!errors.password?.message}
            helperText={errors.password?.message}
            label="New Password"
            type="password"
            {...register("password")}
          />
          <TextField
            error={!!errors.re_password?.message}
            helperText={errors.re_password?.message}
            label="Confirm New Password"
            type="password"
            {...register("re_password")}
          />
          {errors.root?.message ? (
            <Alert severity="error">{errors.root?.message}</Alert>
          ) : null}
          {errors.key ? (
            <Alert severity="error">
              Error: Please check that the password reset link is correct.
            </Alert>
          ) : null}
          <Button type="submit">Change Password</Button>
        </form>
      )}
    </AppPageLayout>
  );
};

export default ResetPasswordConfirmPage;
