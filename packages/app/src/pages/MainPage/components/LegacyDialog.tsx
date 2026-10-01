import React from "react";
import invariant from "tiny-invariant";
import Button from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import TextLink from "@/ui/TextLink";
import * as styles from "./LegacyDialog.module.css";

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;
invariant(ISSUE_URL, "VITE_ISSUE_URL is not set");
const LEGACY_APP_BASE_URL = import.meta.env.VITE_LEGACY_APP_BASE_URL;
invariant(LEGACY_APP_BASE_URL, "VITE_LEGACY_APP_BASE_URL is not set");

type LegacyDialogProps = {
  sceneKey: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const LegacyDialog: React.FC<LegacyDialogProps> = ({
  sceneKey,
  open,
  onOpen,
  onClose,
}) => {
  const legacyHref = `${LEGACY_APP_BASE_URL}/${sceneKey}`;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => (next ? onOpen() : onClose())}
    >
      <Dialog.Trigger
        render={
          <Button size="sm" className={styles.trigger}>
            Legacy Scene
          </Button>
        }
      />
      <Dialog.Popup size="sm">
        <Dialog.Header>
          <Dialog.Title>Legacy Scene</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <p>
            This scene was created with an older version of Math3d. It should
            load correctly. If it does not, please{" "}
            <TextLink href={ISSUE_URL} target="_blank" rel="noreferrer">
              report an issue
            </TextLink>
            .
          </p>

          <p>
            <em>
              The scene can also be viewed on the old site at{" "}
              <TextLink href={legacyHref} target="_blank" rel="noreferrer">
                {legacyHref}
              </TextLink>
              .
            </em>
          </p>
        </Dialog.Body>
        <Dialog.Actions>
          <Dialog.Close render={<Button>Close</Button>} />
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default LegacyDialog;
export type { LegacyDialogProps };
