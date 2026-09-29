import React, { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import Alert from "@mui/material/Alert";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useCreateScene } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useOverlay } from "@/features/overlays/useOverlay";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import BasicDialog from "@/util/components/BasicDialog";
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
 * Publishes the scene as a new one: asks for a title, then shows the link.
 * Both steps are one dialog, so assistive tech stays in it across the swap.
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
  const hasKey = useAppSelector(select.key) !== null;
  const [publishedUrl, setPublishedUrl] = useState(existingUrl);
  // Fixed at open: publishing replaces the store's title with the new one.
  // An anonymous scene may be the user's own from before signing in, so a
  // copy of it isn't "Copy of"; nor is a copy of an untitled scene.
  const [defaultTitle] = useState(() =>
    mode === "copy" && author !== null && title.trim() !== ""
      ? `Copy of ${title}`
      : title,
  );
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
    onSubmit: publish,
  });
  const { copy, message } = useLinkCopy(publishedUrl ?? "");

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
        mode === "share" && hasKey ? (
          <Alert severity="info" role="note">
            This creates a new link showing the scene as it looks now. The
            original link is unchanged.
          </Alert>
        ) : undefined,
      )}
    </BasicDialog>
  );
};

export default PublishDialog;
export { sceneUrl };
export type { PublishMode };
