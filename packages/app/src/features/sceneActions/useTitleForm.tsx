import React, { useId } from "react";
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
 * A validated scene-title form for a dialog body. The dialog's confirm button
 * submits it via `formId`.
 */
const useTitleForm = ({ defaultTitle, onSubmit }: UseTitleFormOptions) => {
  const formId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useValidatedForm({ schema, defaultValues: { title: defaultTitle } });

  /** `note` is shown above the title field. */
  const renderForm = (note?: React.ReactNode) => (
    <form id={formId} onSubmit={handleSubmit(({ title }) => onSubmit(title))}>
      {note}
      <TextField
        margin="dense"
        fullWidth
        autoFocus
        label="Title"
        placeholder={UNTITLED}
        // Keep the label above the field so the placeholder always shows.
        slotProps={{ inputLabel: { shrink: true } }}
        {...register("title")}
      />
      {errors.root?.message ? (
        <Alert severity="error">{errors.root.message}</Alert>
      ) : null}
    </form>
  );

  return { formId, isSubmitting, renderForm };
};

export default useTitleForm;
