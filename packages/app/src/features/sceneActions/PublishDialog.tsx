import React, { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router";
import * as Sentry from "@sentry/react";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useCreateScene } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useOverlay } from "@/features/overlays/useOverlay";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
import { sceneDisplayName } from "@/features/scene/sceneTitle";
import useTitleForm from "./useTitleForm";
import { LinkField, useLinkCopy } from "./LinkDialog";

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
  const { open: openOverlay } = useOverlay();
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
  const copyButtonId = useId();

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

  const { formId, isSubmitting, renderForm } = useTitleForm({
    defaultTitle,
    onSubmit: (newTitle) => {
      setAutoPublishFailed(false);
      return publish(newTitle);
    },
  });
  const { copy, message } = useLinkCopy(publishedUrl ?? "");

  useEffect(() => {
    if (publishedUrl || asksTitle || autoPublishStarted.current) return;
    autoPublishStarted.current = true;
    publish(defaultTitle).catch((err) => {
      Sentry.captureException(err);
      setAutoPublishFailed(true);
      setAsksTitle(true);
    });
  });

  // The title field unmounts on the swap; land on the step's next action.
  useEffect(() => {
    if (publishedUrl) document.getElementById(copyButtonId)?.focus();
  }, [publishedUrl, copyButtonId]);

  const common = {
    open: true,
    fullWidth: true,
    maxWidth: "xs",
    onClose,
  } as const;

  if (publishedUrl) {
    return (
      <BasicDialog
        {...common}
        title={headings.link}
        onConfirm={copy}
        confirmText="Copy link"
        confirmButtonProps={{ id: copyButtonId, autoFocus: true }}
        cancelText="Done"
      >
        <LinkField url={publishedUrl} message={message} />
        {mode === "share" && fromLink && !existingUrl ? (
          <Typography variant="body2" role="note">
            This is a new link showing the scene as it looks now. The original
            link is unchanged.
          </Typography>
        ) : null}
        {mode === "share" && DISPLAY_AUTH_FLOWS ? (
          <Typography variant="body2">
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              onClick={() => {
                onClose();
                openOverlay("login");
              }}
            >
              Sign in
            </MuiLink>{" "}
            to save scenes you can keep editing.
          </Typography>
        ) : null}
      </BasicDialog>
    );
  }
  if (!asksTitle) {
    return (
      <BasicDialog
        {...common}
        closeDisabled
        title={headings.title}
        showFooter={false}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <CircularProgress size="1.5rem" />
          <Typography>{headings.submitting}</Typography>
        </Stack>
      </BasicDialog>
    );
  }
  return (
    <BasicDialog
      {...common}
      // The submit still completes after a close, so closing mid-submit
      // would navigate away from under the user.
      closeDisabled={isSubmitting}
      title={headings.title}
      confirmText={isSubmitting ? headings.submitting : headings.confirm}
      cancelButton={null}
      confirmButtonProps={{
        id: copyButtonId,
        type: "submit",
        form: formId,
        disabled: isSubmitting,
      }}
    >
      {renderForm(
        autoPublishFailed ? (
          <Alert severity="error">
            Something went wrong. Please try again later.
          </Alert>
        ) : undefined,
      )}
    </BasicDialog>
  );
};

export default PublishDialog;
export { sceneUrl };
export type { PublishMode };
