import Button from "@mui/material/Button";
import React, { useCallback, useId, useRef, useState } from "react";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useAppSelector } from "@/store/hooks";
import { useCreateScene, useUserMe } from "@math3d/api";
import Popover from "@mui/material/Popover";
import type { PopoverProps } from "@mui/material/Popover";
import { useToggle } from "@/util/hooks";
import TextField from "@mui/material/TextField";
import classNames from "classnames";
import { useNavigate } from "react-router";
import Dialog from "@mui/material/Dialog";
import Alert from "@mui/material/Alert";
import styles from "./ShareButton.module.css";
import { select } from "./sceneSlice";

type ShareBodyProps = {
  loading: boolean;
  url: string;
  hasUnsavedChanges: boolean;
};

const ShareBody: React.FC<ShareBodyProps> = ({
  loading,
  url,
  hasUnsavedChanges,
}) => {
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
          {hasUnsavedChanges ? (
            <Alert severity="info" className={styles["share-note"]}>
              This scene has unsaved changes.
            </Alert>
          ) : null}
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
  const meQuery = useUserMe();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [newlyCreatedUrl, setNewlyCreatedUrl] = useState("");
  const dirty = useAppSelector(select.dirty);

  const { author, ...scene } = useAppSelector(select.sceneInfo);
  const [open, toggleOpen] = useToggle(false);
  const createScene = useCreateScene();

  const url = meQuery.data
    ? `${window.location.origin}/${scene.key ?? ""}`
    : newlyCreatedUrl;

  const handleClick = useCallback(async () => {
    toggleOpen.on();
    if (meQuery.data) {
      return;
    }
    const result = await createScene.mutateAsync(scene);
    navigate({
      pathname: `/${result.key}`,
    });
    setNewlyCreatedUrl(`${window.location.origin}/${result.key}`);
  }, [toggleOpen, createScene, scene, navigate, meQuery.data]);

  const hasUnsavedChanges = !!meQuery.data && dirty;
  return (
    <>
      <Button
        data-testid="share"
        aria-describedby={elementId}
        ref={buttonRef}
        variant="text"
        color="secondary"
        onClick={handleClick}
        disabled={meQuery.isLoading || createScene.isPending}
        startIcon={<CloudOutlinedIcon fontSize="inherit" />}
      >
        Share
      </Button>
      {variant === "desktop" ? (
        <Popover
          role="region"
          aria-label="Share scene"
          id={elementId}
          open={open}
          keepMounted={false}
          anchorEl={buttonRef.current}
          onClose={toggleOpen.off}
          anchorOrigin={anchorOrigin}
          transformOrigin={transformOrigin}
        >
          <ShareBody
            hasUnsavedChanges={hasUnsavedChanges}
            url={url}
            loading={createScene.isPending}
          />
        </Popover>
      ) : (
        <Dialog open={open} onClose={toggleOpen.off}>
          <ShareBody
            hasUnsavedChanges={hasUnsavedChanges}
            url={newlyCreatedUrl}
            loading={createScene.isPending}
          />
        </Dialog>
      )}
    </>
  );
};

export default ShareButton;
