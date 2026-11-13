import { DEFAULT_RENDERER, isRenderer } from "./renderers";
import type { Renderer } from "./renderers";

/** The `?renderer=` param, else the stored preference, else the default. */
const resolveRenderer = ({
  param,
  preference,
}: {
  param: string | null;
  preference: Renderer | null;
}): Renderer => (isRenderer(param) ? param : preference) ?? DEFAULT_RENDERER;

export { resolveRenderer };
