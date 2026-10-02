import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { useCreateScene } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import { Dialog } from "@/ui/Dialog";
import Button from "@/ui/Button";
import { TextButton } from "@/ui/TextLink";
import useTitleForm from "./useTitleForm";
import { LinkActions, LinkField, useLinkCopy } from "./LinkDialog";

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
  const signIn = useSignInDialog();
  const title = useAppSelector(select.title);
  const author = useAppSelector(select.author);
  const hasKey = useAppSelector(select.key) !== null;
  const [publishedUrl, setPublishedUrl] = useState(existingUrl);
  // Fixed at open: publishing replaces the store's title with the new one.
  // An anonymous scene may be the user's own from before signing in, so a
  // copy of it isn't "Copy of".
  const [defaultTitle] = useState(() =>
    mode === "copy" && author !== null ? `Copy of ${title}` : title,
  );
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
    onSubmit: publish,
  });
  const { copy, message } = useLinkCopy(publishedUrl ?? "");

  // The title step unmounts on the swap; land on the link step's action.
  useEffect(() => {
    if (publishedUrl) copyRef.current?.focus();
  }, [publishedUrl]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        // The submit still completes after a close, so closing mid-submit
        // would navigate away from under the user.
        if (!open && !isSubmitting) onClose();
      }}
    >
      <Dialog.Popup size="sm" initialFocus={publishedUrl ? copyRef : titleRef}>
        <Dialog.Header closeDisabled={isSubmitting}>
          <Dialog.Title>
            {publishedUrl ? headings.link : headings.title}
          </Dialog.Title>
        </Dialog.Header>
        {publishedUrl ? (
          <>
            <Dialog.Body>
              <LinkField url={publishedUrl} message={message} />
              {mode === "share" && DISPLAY_AUTH_FLOWS ? (
                <Typography variant="body2">
                  <TextButton
                    onClick={() => {
                      onClose();
                      signIn.open();
                    }}
                  >
                    Sign in
                  </TextButton>{" "}
                  to save scenes you can keep editing.
                </Typography>
              ) : null}
            </Dialog.Body>
            <LinkActions onCopy={copy} copyRef={copyRef} />
          </>
        ) : (
          <Dialog.Form onSubmit={handleSubmit}>
            <Dialog.Body>
              {renderFields(
                mode === "share" && hasKey ? (
                  <Alert severity="info" role="note">
                    This creates a new link showing the scene as it looks now.
                    The original link is unchanged.
                  </Alert>
                ) : undefined,
              )}
            </Dialog.Body>
            <Dialog.Actions>
              <Dialog.Close
                render={<Button>Cancel</Button>}
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                variant="solid"
                tone="accent"
                loading={isSubmitting}
              >
                {isSubmitting ? headings.submitting : headings.confirm}
              </Button>
            </Dialog.Actions>
          </Dialog.Form>
        )}
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default PublishDialog;
export { sceneUrl };
export type { PublishMode };
