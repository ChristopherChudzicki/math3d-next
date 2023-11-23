import Button from "@mui/material/Button";
import React, { useCallback, useId, useRef, useState } from "react";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useAppSelector } from "@/store/hooks";
import { useCreateScene } from "@/api/scene";
import Popover from "@mui/material/Popover";
import type { PopoverProps } from "@mui/material/Popover";
import { useToggle } from "@/util/hooks";
import TextField from "@mui/material/TextField";
import classNames from "classnames";
import { useNavigate } from "react-router-dom";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Dialog from "@mui/material/Dialog";
import styles from "./ShareButton.module.css";
import { select } from "./mathItemsSlice";

type ShareBodyProps = {
  loading: boolean;
  url: string;
};

const ShareBody: React.FC<ShareBodyProps> = ({ loading, url }) => {
  const [copied, toggleCopied] = useToggle(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url);
    toggleCopied.on();
  }, [toggleCopied, url]);
  return (
    <div className={styles["share-popover"]}>
      {loading ? (
        <div className={styles.saving}>Loading...</div>
      ) : (
        <>
          <TextField
            className={styles.input}
            fullWidth
            size="small"
            label="Shareable URL"
            InputProps={{
              readOnly: true,
            }}
            value={url}
          />
          <Button
            variant="contained"
            className={styles["copy-button"]}
            size="small"
            onClick={handleCopy}
          >
            Copy
          </Button>
          <div
            className={classNames(styles["copied-indicator"], {
              [styles.copied]: copied,
              [styles["not-copied"]]: !copied,
            })}
          >
            Copied!
          </div>
        </>
      )}
    </div>
  );
};

const anchorOrigin: PopoverProps["anchorOrigin"] = {
  vertical: "bottom",
  horizontal: "center",
};
const transformOrigin: PopoverProps["transformOrigin"] = {
  vertical: "top",
  horizontal: "right",
};

type ShareButtonProps = {
  variant: "mobile" | "desktop";
};

const ShareButton: React.FC<ShareButtonProps> = ({ variant }) => {
  const elementId = useId();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState("");

  const scene = useAppSelector(select.scene());
  const [open, toggleOpen] = useToggle(false);
  const createScene = useCreateScene();
  const handleClick = useCallback(async () => {
    toggleOpen.on();
    const result = await createScene.mutateAsync(scene);
    navigate({
      pathname: `/${result.key}`,
    });
    setUrl(`${window.location.origin}/${result.key}`);
  }, [toggleOpen, createScene, scene, navigate]);

  if (variant === "mobile") {
    return (
      <>
        <MenuItem onClick={handleClick} disabled={createScene.isPending}>
          <ListItemIcon>
            <CloudOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <Dialog open={open} onClose={toggleOpen.off}>
          <ShareBody url={url} loading={createScene.isPending} />
        </Dialog>
      </>
    );
  }
  if (variant === "desktop") {
    return (
      <>
        <Button
          aria-describedby={elementId}
          ref={buttonRef}
          variant="text"
          color="secondary"
          onClick={handleClick}
          disabled={createScene.isPending}
          startIcon={<CloudOutlinedIcon fontSize="inherit" />}
        >
          Share
        </Button>
        <Popover
          id={elementId}
          open={open}
          keepMounted={false}
          anchorEl={buttonRef.current}
          onClose={toggleOpen.off}
          anchorOrigin={anchorOrigin}
          transformOrigin={transformOrigin}
        >
          <ShareBody url={url} loading={createScene.isPending} />
        </Popover>
      </>
    );
  }

  throw new Error(`Unexpected variant: ${variant}`);
};

export default ShareButton;
