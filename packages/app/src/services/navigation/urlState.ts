import { rootRouteId, useParams, useSearch } from "@tanstack/react-router";
import { SCENE_KEY_PATTERN } from "@/config/sceneKey";

/**
 * The search params every route shares. Reading through the root, matched on
 * every page, never throws, unlike a read `from` a route that isn't.
 */
export const useRootSearch = () => useSearch({ from: rootRouteId });

/**
 * The scene key in the URL, on whichever route has one. A limit, not a goal:
 * on a not-found path that starts like a scene's (`/abc/extra`) it is still
 * `"abc"`. Comparing the leaf match's path with the URL's would drop it, but
 * flickers to `undefined` on every scene-to-scene navigation.
 */
export const useRouteSceneKey = (): string | undefined =>
  useParams({
    strict: false,
    // A path the scene route rejects as a key still leaves its first segment
    // in the params (`/app/nope` → `"app"`).
    select: ({ sceneKey }) =>
      sceneKey !== undefined && SCENE_KEY_PATTERN.test(sceneKey)
        ? sceneKey
        : undefined,
  });
