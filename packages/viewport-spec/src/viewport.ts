/**
 * The viewport as data, for a renderer that draws from specs, and the hooks
 * it calls back with.
 */
import type { AxesRange, Coords } from "./coordinates";
import type { CameraSpec, GraphicSpec } from "./types";

export type ViewportGraphic = { id: string; spec: GraphicSpec };

export type ViewportSpec = {
  /** The axes' extent in math coordinates. */
  range: AxesRange;
  /**
   * Each axis's half-length in view coordinates: `range` maps onto
   * `[-scale, scale]`.
   */
  scale: Coords;
  /** Seen with a 60° field of view, as both MathBox and Use.GPU draw it. */
  camera: CameraSpec;
  /** A parallel projection instead of perspective. */
  orthographic: boolean;
  controls: { rotate: boolean; pan: boolean; zoom: boolean };
  /**
   * In the scene's item order; a graphic with nothing to draw is absent.
   * Each `spec` keeps its identity until it changes, so a renderer can skip a
   * graphic whose `spec` is `===` the last one with the same `id`.
   */
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
