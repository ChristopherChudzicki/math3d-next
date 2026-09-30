import React, { useRef } from "react";
import { AlertDialog } from "@/ui/AlertDialog";
import Button from "@/ui/Button";

type DeleteSceneDialogProps = {
  /** The scene awaiting confirmation; null keeps the dialog closed. */
  title: string | null;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Where focus goes on close; the menu item that opened the dialog is gone. */
  finalFocus: () => HTMLElement | null;
};

const DeleteSceneDialog: React.FC<DeleteSceneDialogProps> = ({
  title,
  deleting,
  onConfirm,
  onCancel,
  finalFocus,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root
      open={title !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen && !deleting) onCancel();
      }}
    >
      <AlertDialog.Popup initialFocus={cancelRef} finalFocus={finalFocus}>
        <AlertDialog.Title>Delete scene?</AlertDialog.Title>
        <AlertDialog.Description>
          Delete &ldquo;{title}&rdquo;? This can&rsquo;t be undone.
        </AlertDialog.Description>
        <AlertDialog.Actions>
          <AlertDialog.Close
            disabled={deleting}
            render={<Button ref={cancelRef}>Cancel</Button>}
          />
          <Button
            variant="solid"
            tone="danger"
            loading={deleting}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
};

export default DeleteSceneDialog;
