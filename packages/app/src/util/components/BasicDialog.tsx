import React, { useCallback, useState } from "react";
import Dialog from "@mui/material/Dialog";
import type { DialogProps } from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
};

type BasicDialogProps = {
  className?: string;
  open: boolean;
  onClose: () => void;
  /**
   * MUI Dialog's [TransitionProps](https://mui.com/material-ui/api/dialog/#props)
   */
  TransitionProps?: DialogProps["TransitionProps"];
  onConfirm?: () => void | Promise<void>;
  title: string;
  children?: React.ReactNode;
  /**
   * The text to display on the cancel button. Defaults to "Cancel".
   */
  cancelText?: string;
  /**
   * The text to display on the confirm button. Defaults to "Confirm".
   */
  confirmText?: string;
  cancelButton?: React.ReactNode;
  confirmButton?: React.ReactNode;
  cancelButtonProps?: ButtonProps;
  confirmButtonProps?: ButtonProps;
  /**
   * Defaults to `true`. If `true`, dialog grows to `maxWidth`. See
   * [Dialog Props](https://mui.com/material-ui/api/dialog/#props).
   */
  fullWidth?: boolean;
  /**
   * Whether to show the footer buttons. Defaults to `true`.
   */
  showFooter?: boolean;
  maxWidth?: DialogProps["maxWidth"];
};

/**
 * A basic modal dialog.
 *
 * This is useful for things like confirmation or notifications, but not
 * particularly good for forms, where a <form /> element should wrap the inputs
 * and footer buttons.
 */
const BasicDialog: React.FC<BasicDialogProps> = ({
  title,
  children,
  open,
  onClose,
  onConfirm,
  cancelText = "Cancel",
  confirmText = "Confirm",
  cancelButton,
  confirmButton,
  cancelButtonProps,
  confirmButtonProps,
  fullWidth,
  className,
  showFooter = true,
  TransitionProps,
  maxWidth,
}) => {
  const [confirming, setConfirming] = useState(false);
  const handleConfirm = useCallback(async () => {
    try {
      setConfirming(true);
      if (onConfirm) {
        await onConfirm();
      }
    } finally {
      setConfirming(false);
    }
  }, [onConfirm]);
  return (
    <Dialog
      className={className}
      fullWidth={fullWidth}
      open={open}
      onClose={onClose}
      TransitionProps={TransitionProps}
      maxWidth={maxWidth}
      sx={{
        "> *:first-child": {
          marginTop: 0,
        },
      }}
    >
      <div style={topRightStyle}>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </div>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      {showFooter && (
        <DialogActions>
          {cancelButton === undefined ? (
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
              {...cancelButtonProps}
            >
              {cancelText}
            </Button>
          ) : (
            cancelButton
          )}
          {confirmButton === undefined ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={confirming}
              {...confirmButtonProps}
            >
              {confirmText}
            </Button>
          ) : (
            confirmButton
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BasicDialog;
export type { BasicDialogProps };
