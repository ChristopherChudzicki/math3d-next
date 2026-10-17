import React, { useRef } from "react";
import { AlertDialog } from "@/ui/AlertDialog";
import Button from "@/ui/Button";
import styles from "./ScenesList.module.css";

type DeleteSceneDialogProps = {
  open: boolean;
  /** Kept while the dialog animates closed, so its text doesn't blank out. */
  title: string;
  deleting: boolean;
  failed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** After the close animation; clear the scene here. */
  onClosed: () => void;
  finalFocus: () => HTMLElement | null;
};

const DeleteSceneDialog: React.FC<DeleteSceneDialogProps> = ({
  open,
  title,
  deleting,
  failed,
  onConfirm,
  onCancel,
  onClosed,
  finalFocus,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !deleting) onCancel();
      }}
      onOpenChangeComplete={(isOpen) => {
        if (!isOpen) onClosed();
      }}
    >
      <AlertDialog.Popup initialFocus={cancelRef} finalFocus={finalFocus}>
        <AlertDialog.Title>Delete scene?</AlertDialog.Title>
        <AlertDialog.Description>
          Delete &ldquo;{title}&rdquo;? This can&rsquo;t be undone.
        </AlertDialog.Description>
        {failed ? (
          <p className={styles.error} role="alert">
            Couldn&rsquo;t delete the scene. Try again.
          </p>
        ) : null}
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
