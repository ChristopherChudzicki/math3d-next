import { useScene, isApiError } from "@math3d/api";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import { useAppDispatch } from "@/store/hooks";
import defaultScene from "@/store/defaultScene";
import { sceneSlice } from "@/features/sceneControls/mathItems";
import { useNotifications } from "@/features/notifications/NotificationsContext";

const { actions: itemActions } = sceneSlice;

/**
 * How a not-found (404) scene is handled.
 *
 * - `"redirect"` — notify the user and navigate home. Used by the editor.
 * - `"silent"` — do nothing; the scene simply never populates Redux. Used by
 *   the headless `/app/frame` render page, where a screenshotter must not be
 *   shown a dialog or redirected.
 */
type OnNotFound = "redirect" | "silent";

/**
 * Fetches a scene by key and loads it into Redux, independently of any UI
 * chrome. This is the single place scene data-loading happens: fetch (React
 * Query) → `setScene` dispatch → `document.title`, plus 404 handling.
 *
 * `SceneControls` and `<Scene>` both read the resulting Redux state; neither
 * needs to be mounted for the load to occur.
 */
const useSceneLoader = (
  sceneKey?: string,
  { onNotFound = "redirect" }: { onNotFound?: OnNotFound } = {},
): { isLoading: boolean } => {
  const dispatch = useAppDispatch();

  const { isLoading, data, error } = useScene(sceneKey, {
    enabled: sceneKey !== undefined,
    staleTime: Infinity,
  });

  useEffect(() => {
    const title = data?.title ? `Math3d - ${data.title}` : "Math3d";
    document.title = title;
  }, [data]);

  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();
  useEffect(() => {
    if (onNotFound !== "redirect") return;
    if (isApiError(error, [404])) {
      const { confirmed } = addNotification({
        type: "alert",
        title: "Not found",
        body: "The requested scene could not be found.",
      });
      document.title = "Not found";

      confirmed.then(() => {
        navigate("/");
      });
    }
  }, [error, onNotFound, addNotification, navigate]);

  const scene = sceneKey === undefined ? defaultScene : data;

  useEffect(() => {
    if (!scene) return;
    const payload = {
      key: scene.key,
      author: scene.author ?? null,
      items: scene.items,
      order: scene.itemOrder,
      title: scene.title ?? "",
      isLegacy: scene.isLegacy ?? false,
    };
    dispatch(itemActions.setScene(payload));
  }, [dispatch, scene]);

  return { isLoading };
};

export default useSceneLoader;
export type { OnNotFound };
