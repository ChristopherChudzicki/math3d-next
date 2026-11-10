import { CanvasSurface } from "./CanvasSurface";
import { LabelAtlas } from "./LabelAtlas";
import { atlasInputs } from "./labelMaterial";

const listeners = new Set<() => void>();

/**
 * Calls `listener` whenever labels move in the atlas, as after a pixel-ratio
 * change. Returns the unsubscribe.
 */
export const onLabelRelayout = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const create = (): LabelAtlas => {
  const empty = atlasInputs.texture.value;
  // Lets go of a freed texture's canvas.
  const surface = new CanvasSurface((texture) => {
    atlasInputs.texture.value = texture ?? empty;
  });
  const atlas = new LabelAtlas(surface, () => {
    atlasInputs.size.value.set(...atlas.size);
    atlasInputs.pixelRatio.value = atlas.pixelRatio;
    listeners.forEach((listener) => listener());
  });
  // Browser zoom and a move to another screen change it.
  const watchPixelRatio = () => {
    atlas.setPixelRatio(window.devicePixelRatio);
    window
      .matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      .addEventListener("change", watchPixelRatio, { once: true });
  };
  watchPixelRatio();
  return atlas;
};

let shared: LabelAtlas | null = null;

/** The atlas every label draws from, made on first use. */
export const labelAtlas = (): LabelAtlas => {
  shared ??= create();
  return shared;
};
