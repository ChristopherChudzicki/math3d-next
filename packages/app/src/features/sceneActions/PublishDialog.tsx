import React, { useState } from "react";
import { useNavigate } from "react-router";
import Alert from "@mui/material/Alert";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { useCreateScene } from "@math3d/api";
import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import { actions, select } from "@/features/sceneControls/mathItems";
import { useOverlay } from "@/features/overlays/useOverlay";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import TitleDialog from "./TitleDialog";
import LinkDialog from "./LinkDialog";

type PublishMode = "share" | "save" | "copy";

const HEADINGS: Record<
  PublishMode,
  { title: string; confirm: string; link: string }
> = {
  share: { title: "Share Scene", confirm: "Share", link: "Share Scene" },
  save: { title: "Save Scene", confirm: "Save", link: "Scene Saved!" },
  copy: { title: "Save a Copy", confirm: "Save", link: "Scene Saved!" },
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
  // copy of it isn't "Copy of".
  const [defaultTitle] = useState(() =>
    mode === "copy" && author !== null ? `Copy of ${title}` : title,
  );
  const headings = HEADINGS[mode];

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

  if (publishedUrl) {
    return (
      <LinkDialog heading={headings.link} url={publishedUrl} onClose={onClose}>
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
      </LinkDialog>
    );
  }
  return (
    <TitleDialog
      heading={headings.title}
      confirmText={headings.confirm}
      defaultTitle={defaultTitle}
      onClose={onClose}
      onSubmit={publish}
      note={
        mode === "share" && hasKey ? (
          <Alert severity="info">
            This creates a new link showing the scene as it looks now. The
            original link is unchanged.
          </Alert>
        ) : undefined
      }
    />
  );
};

export default PublishDialog;
export { sceneUrl };
export type { PublishMode };
