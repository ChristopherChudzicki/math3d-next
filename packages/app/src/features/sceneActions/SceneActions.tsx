import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import invariant from "tiny-invariant";
import * as Sentry from "@sentry/react";
import { Icon } from "@iconify/react/offline";
import chevronDown from "@iconify-icons/lucide/chevron-down";
import checkIcon from "@iconify-icons/lucide/check";
import copyIcon from "@iconify-icons/lucide/copy";
import linkIcon from "@iconify-icons/lucide/link";
import saveIcon from "@iconify-icons/lucide/save";
import shareIcon from "@iconify-icons/lucide/share-2";
import { isApiFailure, usePatchScene, useScene, useUserMe } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { settleDraftAfterSave } from "@/store/scene/drafts/storage";
import { sceneDisplayName } from "@/store/scene/sceneTitle";
import { useBanners } from "@/ui/Banners/BannerContext";
import { TextButton } from "@/ui/TextLink";
import * as select from "@/store/scene/state/selectors";
import { useAuthStatus } from "@/services/auth/useAuthStatus";
import { dismissToast } from "@/ui/Toast/toasts";
import Button from "@/ui/Button";
import ButtonGroup from "@/ui/ButtonGroup";
import IconButton from "@/ui/IconButton";
import { Menu } from "@/ui/Menu";
import { Spinner } from "@/ui/LoadingSpinner";
import { useMediaQuery } from "@/util/hooks";
import { PHONE_QUERY } from "@/config/breakpoints";
import PublishDialog, { sceneUrl } from "./PublishDialog";
import type { PublishMode } from "./PublishDialog";
import LinkDialog from "./LinkDialog";
import copyText from "./copyText";
import styles from "./SceneActions.module.css";

const SAVE_FAILED = "Couldn’t save your changes. Try again.";

type Action =
  | "share"
  | "save-new"
  | "save"
  | "save-copy"
  | "copy-link"
  | "duplicate";

// `icon` is phone only; desktop shows labels alone.
const ACTIONS: Record<Action, { label: string; icon: typeof saveIcon }> = {
  share: { label: "Share", icon: shareIcon },
  "save-new": { label: "Save", icon: saveIcon },
  save: { label: "Save", icon: saveIcon },
  "save-copy": { label: "Save a copy", icon: saveIcon },
  "copy-link": { label: "Copy link", icon: linkIcon },
  duplicate: { label: "Duplicate", icon: copyIcon },
};

// Fits the longest label, "Save a copy", so a label swap never shifts layout.
const PRIMARY_WIDTH = "7.5rem";
// A lone md IconButton (`--button-size`). A menu button is wider.
const PHONE_PLACEHOLDER_WIDTH = "2.25rem";
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
}): { primary: Action; menu: Action[] } => {
  if (userId === null) return { primary: "share", menu: [] };
  if (key === null) return { primary: "save-new", menu: [] };
  if (author !== userId) return { primary: "save-copy", menu: ["copy-link"] };
  // Copy link stays above Duplicate, where it is when it's the primary.
  return dirty
    ? { primary: "save", menu: ["copy-link", "duplicate"] }
    : { primary: "copy-link", menu: ["duplicate"] };
};

type Dialog =
  | { kind: "publish"; mode: PublishMode; existingUrl?: string }
  | { kind: "link"; url: string; unsaved: boolean };

const SAVED_SINCE_BANNER = "draft-saved-since";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type PhoneSceneActionProps = {
  primary: Action;
  menu: Action[];
  label: string;
  enabled: boolean;
  saving: boolean;
  flashing: boolean;
  onAction: (action: Action) => void;
  popupRef: React.Ref<HTMLDivElement>;
};

/**
 * The scene action on a phone: an icon button when there is one action, or
 * one menu button listing them all, primary first, when there are several.
 */
const PhoneSceneAction: React.FC<PhoneSceneActionProps> = ({
  primary,
  menu,
  label,
  enabled,
  saving,
  flashing,
  onAction,
  popupRef,
}) => {
  const icon = saving ? (
    <Spinner size="1em" />
  ) : (
    <Icon
      icon={flashing ? checkIcon : ACTIONS[primary].icon}
      aria-hidden="true"
    />
  );
  if (menu.length === 0) {
    return (
      <IconButton
        data-testid="scene-action"
        variant="outline"
        tone="primary"
        label={label}
        loading={!enabled}
        onClick={() => onAction(primary)}
      >
        {icon}
      </IconButton>
    );
  }
  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <IconButton
            data-testid="scene-action"
            variant="outline"
            tone="primary"
            label="Scene actions"
          >
            {icon}
            <Icon
              icon={chevronDown}
              aria-hidden="true"
              className={styles.caret}
            />
          </IconButton>
        }
      />
      {/* The primary item repeats the trigger's icon beside its label, giving
          the icon a key. */}
      <Menu.Popup ref={popupRef}>
        {[primary, ...menu].map((action) => (
          <Menu.Item
            key={action}
            icon={<Icon icon={ACTIONS[action].icon} />}
            disabled={saving}
            onClick={() => onAction(action)}
          >
            {ACTIONS[action].label}
          </Menu.Item>
        ))}
      </Menu.Popup>
    </Menu.Root>
  );
};

/**
 * The header's scene action. On desktop, one button whose label says what it
 * will do (Share, Save, Copy link, Save a copy), plus a menu of secondary
 * actions; on a phone, `PhoneSceneAction`.
 */
const SceneActions: React.FC = () => {
  const authStatus = useAuthStatus();
  const isPhone = useMediaQuery(PHONE_QUERY);
  // The phone and desktop controls are different elements, so crossing the
  // breakpoint (a rotation, a zoom) would drop keyboard focus to the page.
  // Check for focus during render, while the old control still has it, and
  // restore it after commit.
  const controlRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);
  const [shownPhone, setShownPhone] = useState(isPhone);
  if (shownPhone !== isPhone) {
    const focused = document.activeElement;
    refocus.current = [controlRef, popupRef].some(
      (ref) => ref.current?.contains(focused) ?? false,
    );
    setShownPhone(isPhone);
  }
  useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    controlRef.current?.querySelector("button")?.focus();
  }, [isPhone]);
  const { data: me } = useUserMe();
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const patchScene = usePatchScene({ meta: { errorToast: SAVE_FAILED } });
  const key = useAppSelector(select.key);
  const author = useAppSelector(select.author);
  const dirty = useAppSelector(select.dirty);
  // A successful retry dismisses it too, but so does any other way out of the
  // unsaved state: Save a copy, or loading another scene.
  useEffect(() => {
    if (!dirty) dismissToast(SAVE_FAILED);
  }, [dirty]);
  const loaded = useAppSelector((state) => state.scene.loaded);
  const sceneLoad = useAppSelector((state) => state.scene.loadCount);
  const routeKey = useParams().sceneKey ?? null;
  // Tied to the load it was opened on: loading another scene closes it.
  const [opened, setOpened] = useState<{
    dialog: Dialog;
    load: number;
    phone: boolean;
  } | null>(null);
  const dialog = opened?.load === sceneLoad ? opened.dialog : null;
  const setDialog = (next: Dialog | null) =>
    setOpened(next && { dialog: next, load: sceneLoad, phone: isPhone });
  // A dialog returns focus to its opener, which crossing the breakpoint
  // replaces; null keeps Base UI's default.
  const dialogFinalFocus = () =>
    opened?.phone === isPhone
      ? null
      : controlRef.current?.querySelector("button") ?? null;
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<{ text: string } | null>(null);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = setTimeout(() => setFlash(null), FLASH_TIMEOUT);
    return () => clearTimeout(timeout);
  }, [flash]);

  // An opened draft whose scene the author saved again after the version the
  // draft edits: Save would replace that newer version.
  const savedSince = useAppSelector((state) => state.scene.savedSince);
  const warnSavedSince = savedSince && author !== null && me?.id === author;
  // Opening the draft fetched it, so this reads the cache.
  const { data: savedScene } = useScene(key ?? undefined, {
    enabled: warnSavedSince,
  });
  const savedTitle = sceneDisplayName(savedScene?.title ?? "");
  const { show, dismiss } = useBanners();
  const openCopy = useRef(() => {});
  openCopy.current = () => setDialog({ kind: "publish", mode: "copy" });
  useEffect(() => {
    if (!warnSavedSince) return undefined;
    show({
      id: SAVED_SINCE_BANNER,
      severity: "warning",
      ariaLabel: "Dismiss notice about the newer save",
      content: (
        <>
          {savedTitle ? <em>{savedTitle}</em> : "This scene"} was saved after
          these changes were made. <strong>Save</strong> will overwrite that
          newer version.{" "}
          <TextButton onClick={() => openCopy.current()}>
            Save a copy
          </TextButton>
        </>
      ),
    });
    return () => dismiss(SAVED_SINCE_BANNER);
  }, [warnSavedSince, sceneLoad, savedTitle, show, dismiss]);

  const { primary, menu } = getActions({
    userId: me?.id ?? null,
    key,
    author,
    dirty,
  });

  const label =
    (saving && "Saving...") || flash?.text || ACTIONS[primary].label;
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
    const { revision, loadCount, draftId } = state.scene;
    const { title, items, itemOrder } = select.sceneInfo(state);
    const snapshot = { title, items, itemOrder };
    setSaving(true);
    try {
      const [patched] = await Promise.allSettled([
        patchScene.mutateAsync({ key, patch: snapshot }),
        sleep(MIN_SAVING_DELAY),
      ]);
      if (patched.status === "rejected") throw patched.reason;
      if (store.getState().scene.loadCount === loadCount) {
        dispatch(
          actions.markSaved({
            key,
            author,
            revision,
            snapshot,
            modifiedDate: patched.value.modifiedDate,
          }),
        );
      } else {
        settleDraftAfterSave(draftId, snapshot);
      }
      setFlash({ text: "Saved!" });
    } catch (err) {
      // The scene stays dirty, so Save stays available to retry. The mutation
      // cache reports API failures.
      if (!isApiFailure(err)) Sentry.captureException(err);
    } finally {
      setSaving(false);
    }
  };

  const run = (action: Action) => {
    if (action === "share") {
      setDialog(
        dirty || key === null
          ? { kind: "publish", mode: "share" }
          : { kind: "publish", mode: "share", existingUrl: sceneUrl(key) },
      );
    } else if (action === "save-new") {
      setDialog({ kind: "publish", mode: "save" });
    } else if (action === "save-copy" || action === "duplicate") {
      setDialog({ kind: "publish", mode: "copy" });
    } else if (action === "save") {
      save();
    } else {
      copyLink();
    }
  };

  const closeDialog = () => setDialog(null);

  // Wait for auth, which picks the action, and for the route's scene, whose
  // key and author it acts on. The dialogs stay mounted regardless: after a
  // publish, the store's key can reach a render before the route does.
  let control: React.ReactNode;
  if (authStatus === "loading" || !loaded || key !== routeKey) {
    control = (
      <span
        className={styles.placeholder}
        style={{ width: isPhone ? PHONE_PLACEHOLDER_WIDTH : PRIMARY_WIDTH }}
        aria-hidden
      />
    );
  } else if (isPhone) {
    control = (
      <PhoneSceneAction
        primary={primary}
        menu={menu}
        label={label}
        enabled={enabled}
        saving={saving}
        flashing={flash !== null}
        onAction={run}
        popupRef={popupRef}
      />
    );
  } else {
    control = (
      <ButtonGroup aria-label="Scene actions">
        <Button
          data-testid="scene-action"
          tone="primary"
          // Not `disabled`: a disabled button drops keyboard focus to the page
          // after every Save or Copy link.
          loading={!enabled}
          onClick={() => run(primary)}
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
                  tone="primary"
                  label="More scene actions"
                >
                  <Icon icon={chevronDown} aria-hidden="true" />
                </IconButton>
              }
            />
            <Menu.Popup ref={popupRef}>
              {menu.map((action) => (
                <Menu.Item key={action} onClick={() => run(action)}>
                  {ACTIONS[action].label}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Root>
        ) : null}
      </ButtonGroup>
    );
  }

  return (
    <>
      <span role="status" className={styles.status}>
        {/* Desktop's button text says "Saving..."; the phone's icon can't. */}
        {saving && isPhone ? "Saving..." : flash?.text}
      </span>
      <span ref={controlRef} className={styles.control}>
        {control}
      </span>
      {dialog?.kind === "publish" ? (
        <PublishDialog
          mode={dialog.mode}
          existingUrl={dialog.existingUrl}
          onClose={closeDialog}
          finalFocus={dialogFinalFocus}
        />
      ) : null}
      {dialog?.kind === "link" ? (
        <LinkDialog
          heading="Copy link"
          url={dialog.url}
          onClose={closeDialog}
          finalFocus={dialogFinalFocus}
        >
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
