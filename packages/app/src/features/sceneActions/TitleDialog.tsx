import React, { useId } from "react";
import * as yup from "yup";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import BasicDialog from "@/util/components/BasicDialog";
import { useValidatedForm } from "@/util/forms";

const schema = yup.object({
  title: yup.string().trim().required("Please enter a title."),
});

type TitleDialogProps = {
  heading: string;
  confirmText: string;
  defaultTitle: string;
  onSubmit: (title: string) => Promise<void>;
  onClose: () => void;
  /** Shown above the title field. */
  note?: React.ReactNode;
};

const ignore = () => {};

const TitleDialog: React.FC<TitleDialogProps> = ({
  heading,
  confirmText,
  defaultTitle,
  onSubmit,
  onClose,
  note,
}) => {
  const formId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useValidatedForm({ schema, defaultValues: { title: defaultTitle } });

  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="xs"
      // The submit still completes after a close, so closing mid-submit
      // would navigate away from under the user.
      onClose={isSubmitting ? ignore : onClose}
      title={heading}
      confirmText={confirmText}
      cancelButton={null}
      confirmButtonProps={{
        type: "submit",
        form: formId,
        disabled: isSubmitting,
      }}
    >
      <form id={formId} onSubmit={handleSubmit(({ title }) => onSubmit(title))}>
        {note}
        <TextField
          margin="dense"
          fullWidth
          autoFocus
          label="Title"
          error={!!errors.title?.message}
          // A space keeps the row height stable when the message appears.
          helperText={errors.title?.message ?? " "}
          {...register("title")}
        />
        {errors.root?.message ? (
          <Alert severity="error">{errors.root.message}</Alert>
        ) : null}
      </form>
    </BasicDialog>
  );
};

export default TitleDialog;
export type { TitleDialogProps };
