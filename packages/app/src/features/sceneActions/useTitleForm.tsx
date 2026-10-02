import React, { useRef } from "react";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { useValidatedForm } from "@/util/forms";
import { UNTITLED } from "@/features/scene/sceneTitle";

// A blank title means untitled.
const schema = yup.object({
  title: yup.string().trim().default(""),
});

type UseTitleFormOptions = {
  defaultTitle: string;
  onSubmit: (title: string) => Promise<void>;
};

/**
 * A scene-title form. The dialog renders the form element, with
 * `handleSubmit` as its onSubmit, around the fields and its submit button.
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
        placeholder={UNTITLED}
        // Keep the label above the field so the placeholder always shows.
        slotProps={{ inputLabel: { shrink: true } }}
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
    /** The form element's submit handler; trims, then calls `onSubmit`. */
    handleSubmit: handleSubmit(({ title }) => onSubmit(title)),
    renderFields,
  };
};

export default useTitleForm;
