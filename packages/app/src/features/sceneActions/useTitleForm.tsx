import React, { useRef } from "react";
import * as yup from "yup";
import Alert from "@/ui/Alert";
import TextField from "@/ui/TextField";
import composeRefs from "@/util/composeRefs";
import { useValidatedForm } from "@/util/forms";
import { UNTITLED } from "@/features/scene/sceneTitle";
import styles from "./useTitleForm.module.css";

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

  const { ref: registerRef, ...titleField } = register("title");

  /** `note` is shown above the title field. */
  const renderFields = (note?: React.ReactNode) => (
    <div className={styles.fields}>
      {note}
      <TextField
        label="Title"
        placeholder={UNTITLED}
        ref={composeRefs(titleRef, registerRef)}
        {...titleField}
      />
      {errors.root?.message ? (
        <Alert severity="error">{errors.root.message}</Alert>
      ) : null}
    </div>
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
