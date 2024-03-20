import React, { useEffect, useMemo } from "react";
import * as yup from "yup";
import { useUserMe, useUserMePatch } from "@math3d/api";
import { TextField } from "@mui/material";
import { useValidatedForm } from "@/util/forms";

const schema = yup.object({
  public_nickname: yup.string().label("Public nickname").required(),
});

const ProfileForm: React.FC<{
  id: string;
  setDisabled: (disabled: boolean) => void;
}> = ({ id, setDisabled }) => {
  const userQuery = useUserMe();
  const patchUserMe = useUserMePatch();
  const defaultValues = useMemo(() => {
    return {
      public_nickname: userQuery.data?.public_nickname ?? "",
    };
  }, [userQuery.data]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useValidatedForm({
    schema,
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [reset, defaultValues]);

  if (!userQuery.data) return null;

  return (
    <form
      id={id}
      onSubmit={handleSubmit(async (data, event) => {
        if (patchUserMe.isPending) return;
        event?.preventDefault();
        try {
          setDisabled(true);
          await patchUserMe.mutateAsync(data);
        } finally {
          setDisabled(false);
        }
      })}
    >
      <TextField
        fullWidth
        margin="normal"
        disabled
        label="Email"
        type="text"
        value={userQuery.data.email}
      />
      <TextField
        fullWidth
        margin="normal"
        error={!!errors.public_nickname?.message}
        helperText={errors.public_nickname?.message}
        label="Public Nickname"
        type="text"
        {...register("public_nickname")}
      />
    </form>
  );
};

export default ProfileForm;
