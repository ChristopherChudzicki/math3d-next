import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { useSearchParams } from "react-router";
import { Icon } from "@iconify/react/offline";
import externalLink from "@iconify-icons/lucide/external-link";
import type { SceneUnavailableStatus } from "@/app/useSceneLoader";
import BrokenTorus from "@/app/pages/ErrorPage/BrokenTorus";
import buildReportUrl from "@/app/pages/ErrorPage/errorPage.report";
import Viewport from "@/features/viewport/Viewport";
import defaultScene from "@/store/scene/defaultScene";
import sceneSlice from "@/store/scene/state/scene.slice";
import { useAppSelector } from "@/store/hooks";
import { getStore } from "@/store/store";
import RetryButton from "@/ui/Button/RetryButton";
import ButtonLink from "@/ui/ButtonLink";
import { Spinner } from "@/ui/LoadingSpinner";
import { dismissToast, showToast } from "@/ui/Toast/toasts";
import styles from "./SceneUnavailable.module.css";

const COPY: Record<SceneUnavailableStatus, { heading: string; body: string }> =
  {
    offline: {
      heading: "You’re offline.",
      body: "This scene will load when you reconnect.",
    },
    "not-found": {
      heading: "This scene doesn’t exist.",
      body: "It may have been deleted, or the link may be wrong.",
    },
    unreachable: {
      heading: "Couldn’t reach Math3d.",
      body: "Your connection may have dropped, or Math3d may be down. Try again in a moment.",
    },
    failed: {
      heading: "Couldn’t load this scene.",
      body: "Something went wrong on our end.",
    },
  };

/** The default scene's camera, axes and grids, with no items of its own. */
const emptyScene = {
  key: null,
  author: null,
  title: "",
  isLegacy: false,
  items: defaultScene.items.filter(
    (item) => !defaultScene.itemOrder.initialFolder.includes(item.id),
  ),
  order: { ...defaultScene.itemOrder, initialFolder: [] },
};

/**
 * A store of its own for the backdrop, so the app's store keeps the previous
 * route's scene (and its unsaved edits) for Back.
 */
const useEmptySceneStore = () => {
  const [store] = useState(() => {
    const s = getStore();
    s.dispatch(sceneSlice.actions.setScene(emptyScene));
    return s;
  });
  return store;
};

type SceneUnavailableProps = {
  status: SceneUnavailableStatus;
  failure: Error | null;
  /** Re-announces the message when it changes. */
  failedAttempts: number;
  retrying: boolean;
  onRetry: () => void;
  /** Called if the card unmounts while focus is inside it. */
  onUnmountWithFocus: () => void;
};

/**
 * Says why the route's scene can't be shown, on a card over an empty scene.
 * Render with `key={sceneKey}`, so each scene gets its own.
 */
const SceneUnavailable: React.FC<SceneUnavailableProps> = ({
  status,
  failure,
  failedAttempts,
  retrying,
  onRetry,
  onUnmountWithFocus,
}) => {
  const store = useEmptySceneStore();

  // A layout cleanup runs before React removes the card's DOM, so focus is
  // still inside it here.
  const cardRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    return () => {
      if (card?.contains(document.activeElement)) onUnmountWithFocus();
    };
  }, [onUnmountWithFocus]);
  const { heading, body } = COPY[status];

  // The Scenes drawer is a modal over the card (and the whole page on a
  // phone), so if the card appears while it's open, a toast repeats the
  // heading. Reopening the drawer later doesn't toast again.
  const [search] = useSearchParams();
  const [drawerWasOpen] = useState(() => search.get("overlay") === "scenes");
  useEffect(() => {
    if (!drawerWasOpen) return undefined;
    showToast(heading);
    return () => dismissToast(heading);
  }, [drawerWasOpen, status, heading]);

  // `/` keeps the app store's scene when it already holds it, so with unsaved
  // edits there, the link returns to them rather than to a new scene.
  const holdsUnsavedScene = useAppSelector(
    ({ scene }) => scene.loaded && scene.key === null && scene.dirty,
  );
  const canRetry = status === "unreachable" || status === "failed";
  return (
    <div className={styles.container}>
      <Provider store={store}>
        <Viewport />
      </Provider>
      <div className={styles.overlay}>
        <div ref={cardRef} className={styles.card}>
          {status === "offline" ? <Spinner size="1.5rem" /> : null}
          {status === "failed" ? (
            <BrokenTorus className={styles.torus} />
          ) : null}
          <div role={status === "offline" ? "status" : "alert"}>
            <div key={failedAttempts} className={styles.message}>
              <h1 className={styles.heading}>{heading}</h1>
              <p className={styles.body}>{body}</p>
            </div>
          </div>
          {status === "offline" ? null : (
            <div className={styles.actions}>
              {canRetry ? (
                <RetryButton
                  variant="solid"
                  tone="primary"
                  retrying={retrying}
                  onClick={onRetry}
                />
              ) : null}
              <ButtonLink
                to="/"
                variant={canRetry ? "ghost" : "solid"}
                tone={canRetry ? "neutral" : "primary"}
              >
                {holdsUnsavedScene ? "Back to your scene" : "New scene"}
              </ButtonLink>
            </div>
          )}
          {status === "failed" ? (
            <a
              className={styles.report}
              href={buildReportUrl({ message: failure?.message })}
              target="_blank"
              rel="noreferrer"
            >
              Report this bug
              <Icon icon={externalLink} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SceneUnavailable;
