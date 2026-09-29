import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import BasicDialog from "@/util/components/BasicDialog";
import useTitleForm from "./useTitleForm";

type RenameDialogProps = {
  onClose: () => void;
};

/** Renames the scene in the store; like any edit, only Save persists it. */
const RenameDialog: React.FC<RenameDialogProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const title = useAppSelector(select.title);
  const { formId, renderForm } = useTitleForm({
    defaultTitle: title,
    onSubmit: async (newTitle) => {
      // setTitle marks the scene dirty even when the title is unchanged.
      if (newTitle !== title.trim()) {
        dispatch(actions.setTitle({ title: newTitle }));
      }
      onClose();
    },
  });
  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      title="Rename scene"
      confirmText="Rename"
      confirmButtonProps={{ type: "submit", form: formId }}
    >
      {renderForm()}
    </BasicDialog>
  );
};

export default RenameDialog;
