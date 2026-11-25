/** The editor's `?controls=` param: "0" hides the controls panel. */
const CONTROLS_PARAM = "controls";

/**
 * Params a link to another scene keeps from the current URL, each only with
 * the value listed. Copying params wholesale would give crawlers unboundedly
 * many URLs per scene.
 */
const CARRIED_SCENE_PARAMS: readonly (readonly [string, string])[] = [
  [CONTROLS_PARAM, "0"],
];

export { CONTROLS_PARAM, CARRIED_SCENE_PARAMS };
