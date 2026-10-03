import React from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { Dialog } from "@/ui/Dialog";
import Button from "@/ui/Button";
import useTitleForm from "./useTitleForm";

type RenameDialogProps = {
  onClose: () => void;
};

/** Renames the scene in the store; like any edit, only Save persists it. */
const RenameDialog: React.FC<RenameDialogProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const title = useAppSelector(select.title);
  const { titleRef, handleSubmit, renderFields } = useTitleForm({
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
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Popup size="sm" initialFocus={titleRef}>
        <Dialog.Header>
          <Dialog.Title>Rename scene</Dialog.Title>
        </Dialog.Header>
        <Dialog.Form onSubmit={handleSubmit}>
          <Dialog.Body>{renderFields()}</Dialog.Body>
          <Dialog.Actions>
            <Dialog.Close render={<Button>Cancel</Button>} />
            <Button type="submit" variant="solid" tone="accent">
              Rename
            </Button>
          </Dialog.Actions>
        </Dialog.Form>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default RenameDialog;
