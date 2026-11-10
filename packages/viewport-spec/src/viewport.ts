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
  /**
   * When it changes, the renderer moves the view to `camera`; otherwise it
   * leaves the user's view where they put it. Nothing else moves the view.
   */
  cameraRevision: number;
  /**
   * A parallel projection instead of perspective. It shows, at
   * `camera.target`, what the perspective view shows there: a visible height
   * of 2 × |position − target| × tan(30°). Nothing in its view is clipped,
   * including what lies behind `camera.position`. A renderer that zooms it by
   * a zoom factor reports the zoom to `onCameraMove` as distance.
   */
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
  /** The first frame is drawn. */
  onReady(): void;
};
