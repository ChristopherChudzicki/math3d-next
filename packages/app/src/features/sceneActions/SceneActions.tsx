import React, { useEffect, useState } from "react";
import invariant from "tiny-invariant";
import * as Sentry from "@sentry/react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { usePatchScene, useUserMe } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useAuthStatus } from "@/features/auth";
import SimpleMenu from "@/util/components/SimpleMenu/SimpleMenu";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import PublishDialog, { sceneUrl } from "./PublishDialog";
import type { PublishMode } from "./PublishDialog";
import LinkDialog from "./LinkDialog";
import copyText from "./copyText";
import styles from "./SceneActions.module.css";

type Primary = "share" | "save-new" | "save" | "copy-link" | "save-copy";
type MenuAction = "duplicate" | "copy-link";

const LABELS: Record<Primary, string> = {
  share: "Share",
  "save-new": "Save",
  save: "Save",
  "copy-link": "Copy link",
  "save-copy": "Save a Copy",
};

// Fits the longest label, "Save a Copy", so a label swap never shifts layout.
const PRIMARY_WIDTH = "7.5rem";
const MIN_SAVING_DELAY = 500;
const FLASH_TIMEOUT = 2000;

const getActions = ({
  userId,
  key,
  author,
  dirty,
}: {
  userId: number | null;
  key: string | null;
  author: number | null;
  dirty: boolean;
}): { primary: Primary; menu: MenuAction[] } => {
  if (userId === null) return { primary: "share", menu: [] };
  if (key === null) return { primary: "save-new", menu: [] };
  if (author !== userId) return { primary: "save-copy", menu: ["copy-link"] };
  return dirty
    ? { primary: "save", menu: ["duplicate", "copy-link"] }
    : { primary: "copy-link", menu: ["duplicate"] };
};

type DialogState =
  | { kind: "publish"; mode: PublishMode; existingUrl?: string }
  | { kind: "link"; url: string; unsaved: boolean }
  | null;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The header's scene action: one button whose label says what it will do
 * (Share, Save, Copy link, Save a Copy), plus a menu of secondary actions.
 */
const SceneActions: React.FC = () => {
  const authStatus = useAuthStatus();
  const { data: me } = useUserMe();
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const patchScene = usePatchScene();
  const key = useAppSelector(select.key);
  const author = useAppSelector(select.author);
  const dirty = useAppSelector(select.dirty);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ text: string } | null>(null);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = setTimeout(() => setFlash(null), FLASH_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [flash]);

  if (authStatus === "loading") {
    return (
      <span
        className={styles.placeholder}
        style={{ width: PRIMARY_WIDTH }}
        aria-hidden
      />
    );
  }

  const { primary, menu } = getActions({
    userId: me?.id ?? null,
    key,
    author,
    dirty,
  });

  const copyLink = async () => {
    invariant(key, "Only a saved scene has a link.");
    const url = sceneUrl(key);
    if (dirty) {
      setDialog({ kind: "link", url, unsaved: true });
    } else if (await copyText(url)) {
      setFlash({ text: "Copied!" });
    } else {
      setDialog({ kind: "link", url, unsaved: false });
    }
  };

  const save = async () => {
    invariant(key, "Only a saved scene is saved in place.");
    const state = store.getState();
    const { revision } = state.scene;
    const { title, items, itemOrder } = select.sceneInfo(state);
    setSaving(true);
    try {
      await Promise.all([
        patchScene.mutateAsync({ key, patch: { title, items, itemOrder } }),
        sleep(MIN_SAVING_DELAY),
      ]);
      dispatch(actions.markSaved({ key, author, revision }));
      setFlash({ text: "Saved!" });
    } catch (err) {
      // The scene stays dirty, so Save stays available to retry.
      Sentry.captureException(err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrimary = () => {
    if (primary === "share") {
      setDialog(
        dirty || key === null
          ? { kind: "publish", mode: "share" }
          : { kind: "publish", mode: "share", existingUrl: sceneUrl(key) },
      );
    } else if (primary === "save-new") {
      setDialog({ kind: "publish", mode: "save" });
    } else if (primary === "save-copy") {
      setDialog({ kind: "publish", mode: "copy" });
    } else if (primary === "save") {
      save();
    } else {
      copyLink();
    }
  };

  const menuItems: SimpleMenuItem[] = menu.map((action) =>
    action === "duplicate"
      ? {
          type: "button",
          key: "duplicate",
          label: "Duplicate",
          onClick: () => setDialog({ kind: "publish", mode: "copy" }),
        }
      : {
          type: "button",
          key: "copy-link",
          label: "Copy link",
          onClick: () => {
            copyLink();
          },
        },
  );

  const label = (saving && "Saving...") || flash?.text || LABELS[primary];
  const enabled = !saving && !flash && (primary !== "save-new" || dirty);
  const closeDialog = () => setDialog(null);

  return (
    <>
      <span role="status" className={styles.status}>
        {flash?.text}
      </span>
      <ButtonGroup>
        <Button
          data-testid="scene-action"
          variant="text"
          color="primary"
          disabled={!enabled}
          onClick={handlePrimary}
          sx={{ "&.MuiButtonGroup-grouped": { width: PRIMARY_WIDTH } }}
        >
          {label}
        </Button>
        {menu.length > 0 ? (
          <SimpleMenu
            items={menuItems}
            trigger={
              <Button
                variant="text"
                color="secondary"
                aria-label="More scene actions"
              >
                <ExpandMoreIcon fontSize="small" />
              </Button>
            }
          />
        ) : null}
      </ButtonGroup>
      {dialog?.kind === "publish" ? (
        <PublishDialog
          mode={dialog.mode}
          existingUrl={dialog.existingUrl}
          onClose={closeDialog}
        />
      ) : null}
      {dialog?.kind === "link" ? (
        <LinkDialog heading="Copy Link" url={dialog.url} onClose={closeDialog}>
          {dialog.unsaved ? (
            <Typography variant="body2">
              This link shows the last saved version, without your unsaved
              changes.
            </Typography>
          ) : null}
        </LinkDialog>
      ) : null}
    </>
  );
};

export default SceneActions;
