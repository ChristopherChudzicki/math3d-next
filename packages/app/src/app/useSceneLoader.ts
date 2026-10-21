import { classifyFailure, isApiError, useScene } from "@math3d/api";
import { onlineManager } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector, useAppStore } from "@/store/hooks";
import defaultScene from "@/store/scene/defaultScene";
import sceneSlice from "@/store/scene/state/scene.slice";
import { sceneTabTitle } from "@/store/scene/sceneTitle";
import { useKeptFailure } from "@/util/hooks";

const { actions: itemActions } = sceneSlice;

/**
 * Why the route's scene can't be shown:
 * - `"offline"`: the fetch is paused until the browser is back online, when
 *   React Query resumes it on its own.
 * - `"not-found"`: the scene doesn't exist (404).
 * - `"unreachable"`: the request got no response.
 * - `"failed"`: anything else, plausibly our bug.
 */
type SceneUnavailableStatus =
  | "offline"
  | "not-found"
  | "unreachable"
  | "failed";

type SceneLoad = {
  status: "loading" | "ready" | SceneUnavailableStatus;
  /** The last failure loading the route's scene, kept through retries. */
  failure: Error | null;
  /** Increments each time a `retry()` fails. */
  failedAttempts: number;
  retrying: boolean;
  retry: () => void;
};

/**
 * Fetches a scene by key and loads it into Redux, independently of any editor
 * UI. This is the single place scene data-loading happens: fetch (React
 * Query) → `setScene` dispatch → `document.title`.
 *
 * `SceneControls` and `<Viewport>` both read the resulting Redux state; neither
 * needs to be mounted for the load to occur.
 */
const useSceneLoader = (sceneKey?: string): SceneLoad => {
  const dispatch = useAppDispatch();

  const query = useScene(sceneKey, {
    enabled: sceneKey !== undefined,
    staleTime: Infinity,
  });
  const { data, error, fetchStatus } = query;

  const routeKey = sceneKey ?? null;
  const store = useAppStore();
  const holdsRouteScene = useAppSelector(
    (state) => state.scene.loaded && state.scene.key === routeKey,
  );
  // Read, don't subscribe: what matters is whether the store held the route's
  // scene when the failure arrived.
  const { failure, failedAttempts, retrying, retry } = useKeptFailure(
    { error, hasData: !!data, refetch: query.refetch },
    {
      key: sceneKey ?? "",
      keep: () => {
        const { loaded, key } = store.getState().scene;
        return !(loaded && key === routeKey);
      },
    },
  );

  const status = ((): SceneLoad["status"] => {
    // The store can hold this route's scene whatever the fetch did: a failed
    // refetch, a scene just published, or a restored sign-in draft.
    if (sceneKey === undefined || data || holdsRouteScene) return "ready";
    if (failure) {
      if (isApiError(failure, [404])) return "not-found";
      return classifyFailure(failure) === "unreachable"
        ? "unreachable"
        : "failed";
    }
    // A retry in a background tab pauses too, waiting for focus.
    if (fetchStatus === "paused" && !onlineManager.isOnline()) {
      return "offline";
    }
    return "loading";
  })();

  // The site's crawler / link-preview default lives in
  // <meta name="default-title">, which the metadata Worker leaves untouched
  // (it only rewrites <title> per-scene at the edge). Read it once as the
  // no-scene default so the loader gets the true site title whether or not the
  // Worker ran; fall back to document.title for dev/tests where the meta may be
  // absent. Restoring it (not just skipping the write) also keeps SPA
  // navigation correct: leaving a titled scene back home resets the tab instead
  // of stranding the previous scene's title.
  const defaultTitle = useRef(
    document.querySelector<HTMLMetaElement>('meta[name="default-title"]')
      ?.content ?? document.title,
  );

  useEffect(() => {
    if (status === "not-found") {
      document.title = "Not found";
      return;
    }
    // Shared with the Worker's edge <title> rewrite (sceneTitle.ts) so a
    // deep-linked scene shows the same tab title before and after app boot,
    // including the untitled case → the rich site default.
    document.title = data
      ? sceneTabTitle(data.title ?? "", defaultTitle.current)
      : defaultTitle.current;
  }, [data, status]);

  const scene = sceneKey === undefined ? defaultScene : data;

  useEffect(() => {
    // Load only a scene the store doesn't already hold: it may carry unsaved
    // edits or a restored sign-in draft, and `setScene` replaces items/order/
    // title wholesale. Read, don't subscribe: publishing sets the store's key
    // before the route follows, and re-running in between would load the old
    // route's scene over the one just published.
    const { loaded, key } = store.getState().scene;
    if (loaded && key === routeKey) return;
    if (!scene) return;
    dispatch(
      itemActions.setScene({
        key: scene.key,
        author: scene.author ?? null,
        items: scene.items,
        order: scene.itemOrder,
        title: scene.title ?? "",
        isLegacy: scene.isLegacy ?? false,
      }),
    );
  }, [dispatch, scene, routeKey, store]);

  return { status, failure, failedAttempts, retrying, retry };
};

export default useSceneLoader;
export type { SceneUnavailableStatus };
