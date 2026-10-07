import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as Sentry from "@sentry/react";
import { useCreateScene } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import { sceneDisplayName } from "@/features/scene/sceneTitle";
import { Dialog } from "@/ui/Dialog";
import Alert from "@/ui/Alert";
import { Spinner } from "@/ui/LoadingSpinner";
import Button from "@/ui/Button";
import { TextButton } from "@/ui/TextLink";
import useTitleForm from "./useTitleForm";
import { LinkActions, LinkField, useLinkCopy } from "./LinkDialog";
import styles from "./PublishDialog.module.css";

type PublishMode = "share" | "save" | "copy";

const HEADINGS: Record<
  PublishMode,
  { title: string; confirm: string; submitting: string; link: string }
> = {
  share: {
    title: "Share scene",
    confirm: "Share",
    submitting: "Sharing...",
    link: "Share scene",
  },
  save: {
    title: "Save scene",
    confirm: "Save",
    submitting: "Saving...",
    link: "Scene saved!",
  },
  copy: {
    title: "Save a copy",
    confirm: "Save",
    submitting: "Saving...",
    link: "Scene saved!",
  },
};

const sceneUrl = (key: string) => `${window.location.origin}/${key}`;

type PublishDialogProps = {
  mode: PublishMode;
  onClose: () => void;
  /** The scene is already published here: open on the link step. */
  existingUrl?: string;
};

/**
 * Publishes the scene as a new one, then shows the link. Only an untitled
 * scene is asked for a title first. The steps are one dialog, so assistive
 * tech stays in it across the swap.
 */
const PublishDialog: React.FC<PublishDialogProps> = ({
  mode,
  onClose,
  existingUrl,
}) => {
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const createScene = useCreateScene();
  const signIn = useSignInDialog();
  const title = useAppSelector(select.title);
  const author = useAppSelector(select.author);
  const key = useAppSelector(select.key);
  const [fromLink] = useState(key !== null);
  const [publishedUrl, setPublishedUrl] = useState(existingUrl);
  // Fixed at open: publishing replaces the store's title with the new one.
  // An anonymous scene may be the user's own from before signing in, so a
  // copy of it isn't "Copy of"; nor is a copy of an untitled scene.
  const [defaultTitle] = useState(() =>
    mode === "copy" && author !== null && sceneDisplayName(title) !== null
      ? `Copy of ${title}`
      : title,
  );
  const [asksTitle, setAsksTitle] = useState(
    () => sceneDisplayName(defaultTitle) === null,
  );
  const [autoPublishFailed, setAutoPublishFailed] = useState(false);
  // StrictMode runs effects twice; this keeps it to one POST.
  const autoPublishStarted = useRef(false);
  const headings = HEADINGS[mode];
  const copyRef = useRef<HTMLButtonElement>(null);

  const publish = async (newTitle: string) => {
    const state = store.getState();
    const { revision, loadCount } = state.scene;
    const { items, itemOrder } = select.sceneInfo(state);
    const result = await createScene.mutateAsync({
      title: newTitle,
      items,
      itemOrder,
    });
    // The user moved on to another scene while this was in flight.
    if (store.getState().scene.loadCount !== loadCount) return;
    dispatch(
      actions.markSaved({
        key: result.key,
        author: result.author ?? null,
        title: newTitle,
        isLegacy: result.isLegacy ?? false,
        revision,
        loadCount,
      }),
    );
    navigate(`/${result.key}`);
    setPublishedUrl(sceneUrl(result.key));
  };

  const { titleRef, isSubmitting, handleSubmit, renderFields } = useTitleForm({
    defaultTitle,
    onSubmit: (newTitle) => {
      setAutoPublishFailed(false);
      return publish(newTitle);
    },
  });
  const { copy, message } = useLinkCopy(publishedUrl ?? "");
  const autoPublishing = !publishedUrl && !asksTitle;
  const busy = isSubmitting || autoPublishing;

  useEffect(() => {
    if (!autoPublishing || autoPublishStarted.current) return;
    autoPublishStarted.current = true;
    publish(defaultTitle).catch((err) => {
      Sentry.captureException(err);
      setAutoPublishFailed(true);
      setAsksTitle(true);
    });
  });

  // The previous step unmounts on the swap; land on this step's action.
  useEffect(() => {
    if (publishedUrl) copyRef.current?.focus();
    else if (asksTitle) titleRef.current?.focus();
  }, [publishedUrl, asksTitle, titleRef]);

  const renderStep = () => {
    if (publishedUrl) {
      return (
        <>
          <Dialog.Body>
            <LinkField url={publishedUrl} message={message} />
            {mode === "share" && fromLink && !existingUrl ? (
              <p role="note">
                This is a new link showing the scene as it looks now. The
                original link is unchanged.
              </p>
            ) : null}
            {mode === "share" && DISPLAY_AUTH_FLOWS ? (
              <p>
                <TextButton
                  onClick={() => {
                    onClose();
                    signIn.open();
                  }}
                >
                  Sign in
                </TextButton>{" "}
                to save scenes you can keep editing.
              </p>
            ) : null}
          </Dialog.Body>
          <LinkActions onCopy={copy} copyRef={copyRef} />
        </>
      );
    }
    if (autoPublishing) {
      return (
        <Dialog.Body className={styles.publishing}>
          <Spinner size="1.5rem" />
          <span>{headings.submitting}</span>
        </Dialog.Body>
      );
    }
    return (
      <Dialog.Form onSubmit={handleSubmit}>
        <Dialog.Body>
          {renderFields(
            autoPublishFailed ? (
              <Alert severity="error">
                Something went wrong. Please try again later.
              </Alert>
            ) : undefined,
          )}
        </Dialog.Body>
        <Dialog.Actions>
          <Dialog.Close render={<Button>Cancel</Button>} disabled={busy} />
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            loading={isSubmitting}
          >
            {isSubmitting ? headings.submitting : headings.confirm}
          </Button>
        </Dialog.Actions>
      </Dialog.Form>
    );
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // The publish still completes after a close, so closing mid-publish
        // would navigate away from under the user.
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Popup size="sm" initialFocus={publishedUrl ? copyRef : titleRef}>
        <Dialog.Header closeDisabled={busy}>
          <Dialog.Title>
            {publishedUrl ? headings.link : headings.title}
          </Dialog.Title>
        </Dialog.Header>
        {renderStep()}
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default PublishDialog;
export { sceneUrl };
export type { PublishMode };
