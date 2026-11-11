import { CanvasSurface } from "./CanvasSurface";
import { LabelAtlas } from "./LabelAtlas";
import { atlasInputs } from "./labelMaterial";

const create = (): LabelAtlas => {
  const empty = atlasInputs.texture.value;
  const surface = new CanvasSurface((texture) => {
    // The placeholder once freed, so the uniform doesn't keep the canvas alive.
    atlasInputs.texture.value = texture ?? empty;
  });
  const atlas = new LabelAtlas(surface);
  // First, so the shader inputs are current for every later listener.
  atlas.onRelayout(() => {
    atlasInputs.size.value.set(...atlas.size);
    atlasInputs.pixelRatio.value = atlas.pixelRatio;
  });
  // Browser zoom or another screen changes devicePixelRatio; the query
  // matches one ratio, so it is re-armed on each change.
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

/** `LabelAtlas.onRelayout` on the shared atlas. */
export const onLabelRelayout = (listener: () => void): (() => void) =>
  labelAtlas().onRelayout(listener);
