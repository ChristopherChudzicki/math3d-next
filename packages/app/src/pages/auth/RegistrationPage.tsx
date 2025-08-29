import React, { useCallback, useEffect, useId } from "react";
import TextField from "@mui/material/TextField";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { useCreateUser, UserCreatePasswordRetypeRequest } from "@math3d/api";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuthStatus } from "@/features/auth";
import Alert from "@mui/material/Alert";
import { useToggle } from "@/util/hooks";
import { setFieldErrors, OverallError } from "@/util/forms";
import styles from "./styles.module.css";
import BasicDialog from "@/util/components/BasicDialog";

const schema = yup.object({
  email: yup.string().email().label("Email").required(),
  password: yup.string().min(9).label("Password").required(),
  re_password: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Must confirm password"),
  public_nickname: yup.string().label("Public nickname").required(),
});

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const formId = useId();
  const [registering, setRegistering] = useToggle(true);

  const [isAuthenticated] = useAuthStatus();
  const resolver = yupResolver(schema);
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
  const createUser = useCreateUser();
  useEffect(() => {
    if (isAuthenticated) {
      navigateAway();
    }
  }, [isAuthenticated, navigateAway]);

  const createAccount: SubmitHandler<UserCreatePasswordRetypeRequest> =
    useCallback(
      async (data, event) => {
        event?.preventDefault();
        try {
          await createUser.mutateAsync(data);
          setRegistering(false);
        } catch (err) {
          setFieldErrors(data, err, setError);
        }
      },
      [createUser, setError, setRegistering],
    );

  const title = registering ? "Create Account" : "Confirmation Required";
  const cancelButton = registering ? undefined : null; // null will suppress normal button
  const submitButtonContent = registering ? "Create Account" : "OK";
  return (
    <BasicDialog
      title={title}
      open
      onClose={navigateAway}
      cancelButton={cancelButton}
      confirmText={submitButtonContent}
      fullWidth
      confirmButtonProps={
        registering
          ? {
              form: formId,
              type: "submit",
            }
          : { type: "button", onClick: navigateAway }
      }
      maxWidth="xs"
    >
      {registering ? (
        <form
          id={formId}
          className={styles["form-content"]}
          onSubmit={handleSubmit(createAccount)}
        >
          <TextField
            label="Email"
            error={!!errors.email?.message}
            helperText={errors.email?.message}
            {...register("email")}
          />
          <TextField
            error={!!errors.public_nickname?.message}
            helperText={errors.public_nickname?.message}
            label="Public Nickname"
            type="text"
            {...register("public_nickname")}
          />
          <TextField
            error={!!errors.password?.message}
            helperText={errors.password?.message}
            label="Password"
            type="password"
            {...register("password")}
          />
          <TextField
            error={!!errors.re_password?.message}
            helperText={errors.re_password?.message}
            label="Confirm Password"
            type="password"
            {...register("re_password")}
          />
          <OverallError error={errors.root} />
        </form>
      ) : (
        <div className={styles["form-content"]}>
          <Alert severity="success">
            To finish creating your account, please use the link emailed to{" "}
            <span className={styles["email-address"]}>{getValues().email}</span>
            . This email may take a few moments to deliver.
          </Alert>
        </div>
      )}
    </BasicDialog>
  );
};

export default RegistrationPage;
