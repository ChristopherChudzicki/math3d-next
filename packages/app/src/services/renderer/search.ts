import { mixed, string } from "yup";
import { RENDERER_KEYS } from "./renderers";

/**
 * `?renderer=` on every route, as any value, `null` included: the frame page
 * marks an unknown one failed rather than drawing with another renderer.
 */
export const rendererSearchFields = {
  renderer: mixed().nullable(),
};

/**
 * The editor narrows `?renderer=` to a renderer, so a bad one is logged and
 * dropped. A child route can narrow a param its parent accepts, but not
 * recover one its parent dropped.
 */
export const editorRendererSearchFields = {
  renderer: string().oneOf(RENDERER_KEYS),
};
