import React, { useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import { Dialog } from "@/ui/Dialog";
import Button from "@/ui/Button";
import copyText from "./copyText";
import styles from "./LinkDialog.module.css";

const COPY_MESSAGES = {
  copied: "Copied!",
  failed: "Couldn't copy. Select the link and copy it.",
};

/** Copies `url` and describes the result for {@link LinkField}. */
const useLinkCopy = (url: string) => {
  const [result, setResult] = useState<keyof typeof COPY_MESSAGES>();
  const copy = async () => {
    setResult((await copyText(url)) ? "copied" : "failed");
  };
  return { copy, message: result ? COPY_MESSAGES[result] : " " };
};

type LinkFieldProps = { url: string; message: string };

/** The read-only link, with the latest copy result announced below it. */
const LinkField: React.FC<LinkFieldProps> = ({ url, message }) => (
  <TextField
    label="Shareable URL"
    size="small"
    fullWidth
    value={url}
    className={styles["link-field"]}
    slotProps={{
      htmlInput: {
        readOnly: true,
        onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.select(),
      },
    }}
    helperText={<span role="status">{message}</span>}
  />
);

type LinkActionsProps = {
  onCopy: () => void;
  copyRef: React.Ref<HTMLButtonElement>;
};

/** The link step's footer: Done, then Copy link, which starts focused. */
const LinkActions: React.FC<LinkActionsProps> = ({ onCopy, copyRef }) => (
  <Dialog.Actions>
    <Dialog.Close render={<Button>Done</Button>} />
    <Button ref={copyRef} variant="solid" tone="accent" onClick={onCopy}>
      Copy link
    </Button>
  </Dialog.Actions>
);

type LinkDialogProps = {
  heading: string;
  url: string;
  onClose: () => void;
  children?: React.ReactNode;
};

const LinkDialog: React.FC<LinkDialogProps> = ({
  heading,
  url,
  onClose,
  children,
}) => {
  const { copy, message } = useLinkCopy(url);
  const copyRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Popup size="sm" initialFocus={copyRef}>
        <Dialog.Header>
          <Dialog.Title>{heading}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>
          <LinkField url={url} message={message} />
          {children}
        </Dialog.Body>
        <LinkActions onCopy={copy} copyRef={copyRef} />
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default LinkDialog;
export { LinkActions, LinkField, useLinkCopy };
