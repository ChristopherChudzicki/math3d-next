import React, { useCallback, useId, useMemo, useState } from "react";
import { BasicDialog } from "@/pages/auth/components/BasicDialog";
import type { BasicDialogProps } from "@/pages/auth/components/BasicDialog";
import { Alert, FormGroup, TextField, Typography } from "@mui/material";
import { useToggle } from "@/util/hooks";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import { useCreateScene, usePatchScene, useUserMe } from "@math3d/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { select, actions } from "@/features/sceneControls/mathItems";
import u from "@/util/styles/utils.module.css";
import * as yup from "yup";
import { useValidatedForm } from "@/util/forms";
import styles from "./SaveButton.module.css";

const schema = yup.object({
  title: yup.string().required(),
});

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
  const defaultValues = useMemo(() => {
    return {
      title: scene.title,
    };
  }, [scene.title]);
  const { register, handleSubmit } = useValidatedForm({
    schema,
    defaultValues,
  });

  const handleSave: React.FormEventHandler = useMemo(
    () =>
      handleSubmit(async (data) => {
        const { title } = data;
        const result = await createScene.mutateAsync({ ...scene, title });
        onSave();
        navigate({
          pathname: `/${result.key}`,
        });
        setUrl(`${window.location.origin}/${result.key}`);
      }),
    [createScene, handleSubmit, navigate, onSave, scene],
  );

  const handleClose = useCallback(() => {
    onClose({ saved: createScene.isSuccess });
  }, [createScene.isSuccess, onClose]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(url);
    toggleCopied.on();
  }, [toggleCopied, url]);

  const formId = useId();

  const commonProps: Pick<
    BasicDialogProps,
    "fullWidth" | "maxWidth" | "open" | "onClose"
  > = {
    fullWidth: true,
    maxWidth: "xs",
    open,
    onClose: handleClose,
  };

  if (createScene.isSuccess && url) {
    return (
      <BasicDialog
        {...commonProps}
        title="Scene Saved!"
        onConfirm={handleClose}
        confirmText="OK"
        cancelButton={null}
      >
        <>
          <Typography>
            Share your scene with others at the URL below.
          </Typography>
          <FormGroup row className={styles["form-row"]}>
            <TextField
              label="Shareable URL"
              size="small"
              value={url}
              inputProps={{ readOnly: true }}
              helperText={copied ? "Copied!" : " "}
              className={u.flex1}
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
      </BasicDialog>
    );
  }
  return (
    <BasicDialog
      {...commonProps}
      title="Save Scene"
      confirmText="Save"
      cancelButton={null}
      confirmButtonProps={{
        type: "submit",
        form: formId,
      }}
    >
      <form id={formId} onSubmit={handleSave}>
        <TextField
          margin="dense"
          fullWidth
          label="Title"
          {...register("title")}
        />
      </form>
    </BasicDialog>
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

const MIN_SAVING_DELAY = 500;
const RECENTLY_SAVED_TIMEOUT = 3000;

const getSaveText = (state: SavingState, cloning: boolean) => {
  if (state === SavingState.Saving) {
    return "Saving...";
  }
  return cloning ? "Save a Copy" : "Save";
};

const SaveButton: React.FC = () => {
  const [saveDialogOpen, toggleSaveDialog] = useToggle(false);
  const [savingState, setSavingState] = useState(SavingState.Default);
  const navigate = useNavigate();

  const patchScene = usePatchScene();
  const createScene = useCreateScene();
  const dispatch = useAppDispatch();
  const { key, ...scene } = useAppSelector(select.sceneInfo);
  const dirty = useAppSelector(select.dirty);
  const { data: user } = useUserMe();

  const creating = !key;
  const cloning = Boolean(key && user && scene.author !== user.id);
  const updating = Boolean(key && user && scene.author === user.id);
  const handleClick = useCallback(async () => {
    if (creating) {
      toggleSaveDialog.on();
    } else if (updating || cloning) {
      const request = updating
        ? patchScene.mutateAsync({ key, patch: scene })
        : createScene.mutateAsync(scene).then((result) => {
            navigate(`/${result.key}`);
          });
      setSavingState(SavingState.Saving);
      await Promise.all([request, sleep(MIN_SAVING_DELAY)]);
      setSavingState(SavingState.RecentlySaved);
      dispatch(actions.setClean());
      await sleep(RECENTLY_SAVED_TIMEOUT);
      setSavingState(SavingState.Default);
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
    navigate,
  ]);

  if (!user) return null;

  const enabled = savingState === SavingState.Default && (dirty || cloning);

  return (
    <>
      {savingState === SavingState.RecentlySaved ? (
        <Alert className={styles["small-alert"]}>Saved!</Alert>
      ) : null}
      <Button
        variant="outlined"
        color="primary"
        disabled={!enabled}
        onClick={handleClick}
      >
        {getSaveText(savingState, cloning)}
      </Button>
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
