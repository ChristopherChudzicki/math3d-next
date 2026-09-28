import React, { useState } from "react";
import Button from "@mui/material/Button";
import FormGroup from "@mui/material/FormGroup";
import TextField from "@mui/material/TextField";
import BasicDialog from "@/util/components/BasicDialog";
import u from "@/util/styles/utils.module.css";
import copyText from "./copyText";
import styles from "./LinkDialog.module.css";

type LinkDialogProps = {
  heading: string;
  url: string;
  onClose: () => void;
  children?: React.ReactNode;
};

const COPY_MESSAGES = {
  copied: "Copied!",
  failed: "Couldn't copy. Select the link and copy it.",
};

const LinkDialog: React.FC<LinkDialogProps> = ({
  heading,
  url,
  onClose,
  children,
}) => {
  const [copyResult, setCopyResult] = useState<keyof typeof COPY_MESSAGES>();
  return (
    <BasicDialog
      open
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      title={heading}
      onConfirm={onClose}
      confirmText="OK"
      cancelButton={null}
    >
      <FormGroup row className={styles["link-row"]}>
        <TextField
          label="Shareable URL"
          size="small"
          value={url}
          slotProps={{ htmlInput: { readOnly: true } }}
          helperText={copyResult ? COPY_MESSAGES[copyResult] : " "}
          className={u.flex1}
        />
        <Button
          variant="text"
          onClick={async () =>
            setCopyResult((await copyText(url)) ? "copied" : "failed")
          }
          sx={{ alignSelf: "start" }}
        >
          Copy
        </Button>
      </FormGroup>
      {children}
    </BasicDialog>
  );
};

export default LinkDialog;
