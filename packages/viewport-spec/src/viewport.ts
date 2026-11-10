/**
 * The viewport as data, for a renderer that draws from specs, and the hooks
 * it calls back with.
 */
import type { AxesRange, Coords } from "./coordinates";
import type { CameraSpec, GraphicSpec } from "./types";

export type ViewportGraphic = { id: string; spec: GraphicSpec };

export type ViewportSpec = {
  /** The axes' extent, `[min, max]` per axis, in math coordinates. */
  range: AxesRange;
  /** View coordinates map `range` onto `[-scale, scale]` per axis. */
  scale: Coords;
  camera: CameraSpec;
  /** A parallel projection instead of perspective. */
  orthographic: boolean;
  /** Which camera interactions the user may make. */
  controls: { rotate: boolean; pan: boolean; zoom: boolean };
  /** In the scene's item order; a graphic with nothing to draw is absent. */
  graphics: ViewportGraphic[];
};

export type ViewportHooks = {
  /** The renderer can't run in this browser. */
  onUnsupported(error: unknown): void;
  /**
   * The camera as the user moves it, as often as every frame. The app decides
   * when a move has ended.
   */
  onCameraMove(camera: CameraSpec): void;
};
