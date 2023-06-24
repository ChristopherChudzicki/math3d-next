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
import { select } from "./mathItemsSlice";
import styles from "./ShareButton.module.css";

const anchorOrigin: PopoverProps["anchorOrigin"] = {
  vertical: "bottom",
  horizontal: "center",
};
const transformOrigin: PopoverProps["transformOrigin"] = {
  vertical: "top",
  horizontal: "right",
};
const ShareButton: React.FC = () => {
  const elementId = useId();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState("");
  const [copied, toggleCopied] = useToggle(false);
  const scene = useAppSelector(select.scene());
  const [open, toggleOpen] = useToggle(false);
  const createScene = useCreateScene();
  const handleClick = useCallback(async () => {
    toggleOpen.on();
    toggleCopied.off();
    const result = await createScene.mutateAsync(scene);
    navigate({
      pathname: `/${result.key}`,
    });
    setUrl(`${window.location.origin}/${result.key}`);
  }, [toggleOpen, toggleCopied, createScene, scene, navigate]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url);
    toggleCopied.on();
  }, [toggleCopied, url]);

  return (
    <>
      <Button
        aria-describedby={elementId}
        ref={buttonRef}
        variant="text"
        color="secondary"
        onClick={handleClick}
        disabled={createScene.isLoading}
        startIcon={<CloudOutlinedIcon fontSize="inherit" />}
      >
        Share
      </Button>
      <Popover
        id={elementId}
        open={open}
        anchorEl={buttonRef.current}
        onClose={toggleOpen.off}
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
      >
        <div className={styles["share-popover"]}>
          {createScene.isLoading ? (
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
      </Popover>
    </>
  );
};

export default ShareButton;
