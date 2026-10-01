import React, { useRef } from "react";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { useValidatedForm } from "@/util/forms";

const schema = yup.object({
  title: yup.string().trim().required("Please enter a title."),
});

type UseTitleFormOptions = {
  defaultTitle: string;
  onSubmit: (title: string) => Promise<void>;
};

/**
 * A validated scene-title form. The dialog renders the form element, with
 * `onSubmit`, around the fields and its submit button.
 */
const useTitleForm = ({ defaultTitle, onSubmit }: UseTitleFormOptions) => {
  /** The title input, for the dialog's initial focus. */
  const titleRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useValidatedForm({ schema, defaultValues: { title: defaultTitle } });

  /** `note` is shown above the title field. */
  const renderFields = (note?: React.ReactNode) => (
    <>
      {note}
      <TextField
        margin="dense"
        fullWidth
        label="Title"
        error={!!errors.title?.message}
        // A space keeps the row height stable when the message appears.
        helperText={errors.title?.message ?? " "}
        inputRef={titleRef}
        {...register("title")}
      />
      {errors.root?.message ? (
        <Alert severity="error">{errors.root.message}</Alert>
      ) : null}
    </>
  );

  return {
    titleRef,
    isSubmitting,
    onSubmit: handleSubmit(({ title }) => onSubmit(title)),
    renderFields,
  };
};

export default useTitleForm;
