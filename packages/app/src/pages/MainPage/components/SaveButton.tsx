import React, { useCallback, useState } from "react";
import { BasicDialog } from "@/pages/auth/components/BasicDialog";
import type { BasicDialogProps } from "@/pages/auth/components/BasicDialog";
import { FormGroup, TextField, Typography } from "@mui/material";
import { useToggle } from "@/util/hooks";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import { useNavigate } from "react-router";
import { useCreateScene, usePatchScene, useUserMe } from "@math3d/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { select, actions } from "@/features/sceneControls/mathItems";
import CheckIcon from "@mui/icons-material/Check";

type SaveDialogProps = Pick<BasicDialogProps, "open"> & {
  onClose: ({ saved }: { saved: boolean }) => void;
  onSave: () => void;
};

const SaveDialog: React.FC<SaveDialogProps> = ({ open, onClose, onSave }) => {
  const [copied, toggleCopied] = useToggle(false);
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const createScene = useCreateScene();
  const scene = useAppSelector(select.sceneInfo);
  const [title, setTitle] = useState(scene.title);

  const handleSave = useCallback(async () => {
    const result = await createScene.mutateAsync({ ...scene, title });
    onSave();
    navigate({
      pathname: `/${result.key}`,
    });
    setUrl(`${window.location.origin}/${result.key}`);
  }, [createScene, scene, title, onSave, navigate]);

  const handleClose = useCallback(() => {
    onClose({ saved: createScene.isSuccess });
  }, [createScene.isSuccess, onClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url);
    toggleCopied.on();
  }, [toggleCopied, url]);

  const dialogProps =
    createScene.isSuccess && url // && url avoids an initial animation on the label
      ? {
          title: "Scene Saved!",
          confirmText: "OK",
          onConfirm: handleClose,
          cancelButton: null,
          children: (
            <>
              <Typography>
                Share your scene with others at the URL below.
              </Typography>
              <FormGroup row sx={{ marginTop: "1rem" }}>
                <TextField
                  label="Shareable URL"
                  size="small"
                  value={url}
                  inputProps={{ readOnly: true }}
                  helperText={copied ? "Copied!" : " "}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="text"
                  onClick={handleCopy}
                  sx={{ alignSelf: "start" }}
                >
                  Copy
                </Button>
              </FormGroup>
            </>
          ),
        }
      : {
          title: "Save Scene",
          confirmText: "Save",
          onConfirm: handleSave,
          children: (
            <TextField
              margin="dense"
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          ),
        };

  return (
    <BasicDialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={handleClose}
      {...dialogProps}
    />
  );
};

enum SavingState {
  Default = "Default",
  Saving = "Saving",
  RecentlySaved = "RecentlySaved",
}

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const StatefulSavingButton: React.FC<
  ButtonProps & {
    savingState: SavingState;
    saveText: string;
  }
> = ({ saveText, savingState, ...props }) => {
  switch (savingState) {
    case SavingState.Default: {
      return <Button {...props}>{saveText}</Button>;
    }
    case SavingState.Saving: {
      return (
        <Button {...props} role="none">
          Saving...
        </Button>
      );
    }
    case SavingState.RecentlySaved: {
      return (
        <Button startIcon={<CheckIcon />} {...props}>
          Saved!
        </Button>
      );
    }
    default: {
      throw new Error(`Unexpected SavingState: ${savingState}`);
    }
  }
};

const MIN_SAVING_DELAY = 500;
const RECENTLY_SAVED_TIMEOUT = 3000;

const SaveButton: React.FC = () => {
  const [saveDialogOpen, toggleSaveDialog] = useToggle(false);
  const [savingState, setSavingState] = useState(SavingState.Default);

  const patchScene = usePatchScene();
  const createScene = useCreateScene();
  const dispatch = useAppDispatch();
  const { key, ...scene } = useAppSelector(select.sceneInfo);
  const dirty = useAppSelector(select.dirty);
  const { data: user } = useUserMe();

  const creating = !key;
  const cloning = key && user && scene.author !== user.id;
  const updating = key && user && scene.author === user.id;
  const handleClick = useCallback(async () => {
    if (creating) {
      toggleSaveDialog.on();
    } else if (updating || cloning) {
      const request = updating
        ? patchScene.mutateAsync({ key, patch: scene })
        : createScene.mutateAsync(scene);
      setSavingState(SavingState.Saving);
      await Promise.all([request, sleep(MIN_SAVING_DELAY)]);
      setSavingState(SavingState.RecentlySaved);
      await sleep(RECENTLY_SAVED_TIMEOUT);
      setSavingState(SavingState.Default);
      dispatch(actions.setClean());
    }
  }, [
    cloning,
    createScene,
    creating,
    key,
    patchScene,
    scene,
    toggleSaveDialog,
    updating,
    dispatch,
  ]);

  if (!user) return null;

  return (
    <>
      <StatefulSavingButton
        variant="outlined"
        color="primary"
        disabled={!dirty}
        savingState={savingState}
        onClick={handleClick}
        saveText={cloning ? "Save Copy" : "Save"}
      />
      <SaveDialog
        open={saveDialogOpen}
        onClose={async ({ saved }) => {
          toggleSaveDialog.off();
          if (saved) {
            setSavingState(SavingState.RecentlySaved);
            await sleep(RECENTLY_SAVED_TIMEOUT);
            setSavingState(SavingState.Default);
          }
        }}
        onSave={() => {
          setSavingState(SavingState.RecentlySaved);
          dispatch(actions.setClean());
        }}
      />
    </>
  );
};

export default SaveButton;
