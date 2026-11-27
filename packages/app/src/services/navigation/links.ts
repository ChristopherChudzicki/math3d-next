import { linkOptions } from "@tanstack/react-router";

/**
 * A scene's page, or `/` without a key. The key is always passed, even as
 * `undefined`: an omitted optional param carries over from the current URL.
 */
export const sceneLink = (sceneKey?: string) =>
  linkOptions({ to: "/{-$sceneKey}", params: { sceneKey } });

export const homeLink = sceneLink();
