import React, { useState } from "react";
import TextField from "@mui/material/TextField";
import BasicDialog from "@/util/components/BasicDialog";
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
  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      title={heading}
      onConfirm={copy}
      confirmText="Copy link"
      confirmButtonProps={{ autoFocus: true }}
      cancelText="Done"
    >
      <LinkField url={url} message={message} />
      {children}
    </BasicDialog>
  );
};

export default LinkDialog;
export { LinkField, useLinkCopy };
