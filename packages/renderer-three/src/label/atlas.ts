import { CanvasSurface } from "./CanvasSurface";
import { LabelAtlas } from "./LabelAtlas";
import { atlasInputs } from "./labelMaterial";

const listeners = new Set<() => void>();

/**
 * Calls `listener` whenever labels move in the atlas outside a spec update:
 * after a pixel-ratio change or a font load. Returns the unsubscribe.
 */
export const onLabelRelayout = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const create = (): LabelAtlas => {
  const surface = new CanvasSurface((texture) => {
    if (texture) atlasInputs.texture.value = texture;
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
  // `sans-serif` needs no loading, but a web font in its place would draw
  // in a fallback until it loads.
  document.fonts.addEventListener("loadingdone", () => atlas.relayout());
  return atlas;
};

let shared: LabelAtlas | null = null;

/** The atlas every label draws from, made on first use. */
export const labelAtlas = (): LabelAtlas => {
  shared ??= create();
  return shared;
};
