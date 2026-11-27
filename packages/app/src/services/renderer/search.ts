import { string } from "yup";
import { RENDERER_KEYS } from "./renderers";

/** The editor's `?renderer=`, which outranks the stored preference. */
export const rendererSearchFields = {
  renderer: string().oneOf(RENDERER_KEYS),
};
