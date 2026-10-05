import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import invariant from "tiny-invariant";
import * as Sentry from "@sentry/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { usePatchScene, useUserMe } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useAuthStatus } from "@/features/auth";
import Button from "@/ui/Button";
import ButtonGroup from "@/ui/ButtonGroup";
import IconButton from "@/ui/IconButton";
import { Menu } from "@/ui/Menu";
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
  "save-copy": "Save a copy",
};

// Fits the longest label, "Save a copy", so a label swap never shifts layout.
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

type Dialog =
  | { kind: "publish"; mode: PublishMode; existingUrl?: string }
  | { kind: "link"; url: string; unsaved: boolean };

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * The header's scene action: one button whose label says what it will do
 * (Share, Save, Copy link, Save a copy), plus a menu of secondary actions.
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
  const loaded = useAppSelector((state) => state.scene.loaded);
  const sceneLoad = useAppSelector((state) => state.scene.loadCount);
  const routeKey = useParams().sceneKey ?? null;
  // Tied to the load it was opened on: loading another scene closes it.
  const [opened, setOpened] = useState<{
    dialog: Dialog;
    load: number;
  } | null>(null);
  const dialog = opened?.load === sceneLoad ? opened.dialog : null;
  const setDialog = (next: Dialog | null) =>
    setOpened(next && { dialog: next, load: sceneLoad });
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ text: string } | null>(null);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = setTimeout(() => setFlash(null), FLASH_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [flash]);

  const { primary, menu } = getActions({
    userId: me?.id ?? null,
    key,
    author,
    dirty,
  });

  const label = (saving && "Saving...") || flash?.text || LABELS[primary];
  const enabled = !saving && !flash && (primary !== "save-new" || dirty);

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
    const { revision, loadCount } = state.scene;
    const { title, items, itemOrder } = select.sceneInfo(state);
    setSaving(true);
    try {
      const [patched] = await Promise.allSettled([
        patchScene.mutateAsync({ key, patch: { title, items, itemOrder } }),
        sleep(MIN_SAVING_DELAY),
      ]);
      if (patched.status === "rejected") throw patched.reason;
      dispatch(actions.markSaved({ key, author, revision, loadCount }));
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

  const closeDialog = () => setDialog(null);

  return (
    <>
      <span role="status" className={styles.status}>
        {flash?.text}
      </span>
      {/* Wait for auth, which picks the action, and for the route's scene, whose
          key and author it acts on. The dialogs stay mounted regardless: after
          a publish, the store's key can reach a render before the route does. */}
      {authStatus === "loading" || !loaded || key !== routeKey ? (
        <span
          className={styles.placeholder}
          style={{ width: PRIMARY_WIDTH }}
          aria-hidden
        />
      ) : (
        <ButtonGroup>
          <Button
            data-testid="scene-action"
            tone="accent"
            // Not `disabled`: a disabled button drops keyboard focus to the page
            // after every Save or Copy link.
            loading={!enabled}
            onClick={handlePrimary}
            style={{ width: PRIMARY_WIDTH }}
          >
            {label}
          </Button>
          {menu.length > 0 ? (
            <Menu.Root>
              <Menu.Trigger
                disabled={saving}
                render={
                  <IconButton
                    variant="outline"
                    tone="accent"
                    label="More scene actions"
                  >
                    <ExpandMoreIcon fontSize="inherit" />
                  </IconButton>
                }
              />
              <Menu.Popup>
                {menu.includes("duplicate") ? (
                  <Menu.Item
                    onClick={() => setDialog({ kind: "publish", mode: "copy" })}
                  >
                    Duplicate
                  </Menu.Item>
                ) : null}
                {menu.includes("copy-link") ? (
                  <Menu.Item
                    onClick={() => {
                      copyLink();
                    }}
                  >
                    Copy link
                  </Menu.Item>
                ) : null}
              </Menu.Popup>
            </Menu.Root>
          ) : null}
        </ButtonGroup>
      )}
      {dialog?.kind === "publish" ? (
        <PublishDialog
          mode={dialog.mode}
          existingUrl={dialog.existingUrl}
          onClose={closeDialog}
        />
      ) : null}
      {dialog?.kind === "link" ? (
        <LinkDialog heading="Copy link" url={dialog.url} onClose={closeDialog}>
          <p>
            {dialog.unsaved
              ? "This link shows the scene as last saved, without your changes."
              : "Your browser didn't allow copying. Select the link and copy it."}
          </p>
        </LinkDialog>
      ) : null}
    </>
  );
};

export default SceneActions;
