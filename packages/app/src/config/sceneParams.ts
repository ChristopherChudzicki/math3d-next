/** The editor's `?controls=` param: "0" hides the controls panel. */
const CONTROLS_PARAM = "controls";

/**
 * Params the scenes drawer keeps from the current URL when it opens a scene,
 * each only when it has the listed value. Copying params wholesale would give
 * crawlers unboundedly many URLs per scene.
 */
const CARRIED_SCENE_PARAMS: Readonly<Record<string, string>> = {
  [CONTROLS_PARAM]: "0",
};

export { CONTROLS_PARAM, CARRIED_SCENE_PARAMS };
