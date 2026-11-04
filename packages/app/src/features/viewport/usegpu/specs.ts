/**
 * Renderer-neutral description of what a scene draws. React components read
 * the Redux store and MathScope and produce these; the Use.GPU tree consumes
 * them. Nothing in here depends on either renderer.
 */

export type RGBA = [number, number, number, number];
export type Coords = [number, number, number];
export type Range3 = [[number, number], [number, number], [number, number]];

type Common = {
  /** MathBox-style depth bias. Both renderers have one; their scales are not calibrated against each other. */
  zBias: number;
};

export type PointSpec = Common & {
  kind: "point";
  positions: Coords[];
  size: number;
  color: RGBA;
};

export type LineSpec = Common & {
  kind: "line";
  paths: Coords[][];
  width: number;
  color: RGBA;
  start: boolean;
  end: boolean;
  arrowSize: number;
};

export type SurfaceSpec = Common & {
  kind: "surface";
  /** Sample counts along the two parameters. */
  samples: [number, number];
  /** Position at normalized parameters in [0, 1]². */
  position: (u: number, v: number) => Coords;
  /** Color (with opacity) at normalized parameters in [0, 1]². */
  colorAt: (u: number, v: number) => RGBA;
  shaded: boolean;
  grid: { lines: [number, number]; width: number; color: RGBA };
};

export type ImplicitSurfaceSpec = Common & {
  kind: "implicit";
  domain: Range3;
  /** Samples per axis. */
  samples: number;
  /** The surface is the zero level set of this function. */
  value: (x: number, y: number, z: number) => number;
  color: RGBA;
  shaded: boolean;
};

export type AxisSpec = Common & {
  kind: "axis";
  axis: "x" | "y" | "z";
  width: number;
  color: RGBA;
  start: boolean;
  end: boolean;
  arrowSize: number;
};

export type GridSpec = Common & {
  kind: "grid";
  axes: "xy" | "yz" | "zx";
  divisions: [number, number];
  /** Snap gridlines to round values instead of dividing the range evenly. */
  snap: boolean;
  width: number;
  color: RGBA;
};

export type GraphicSpec =
  | PointSpec
  | LineSpec
  | SurfaceSpec
  | ImplicitSurfaceSpec
  | AxisSpec
  | GridSpec;

export type CameraSpec = {
  /**
   * Camera and target in MathBox's cartesian coordinates: the axes' range
   * mapped onto [-scale, scale], z up. That is what the camera item's
   * `position`/`target` convert to in the MathBox viewport.
   */
  position: Coords;
  target: Coords;
};

/** Use.GPU `OrbitControls` parameters (world coordinates, y up). */
export type OrbitSpec = {
  radius: number;
  bearing: number;
  pitch: number;
  target: Coords;
};

export type SceneSpec = {
  range: Range3;
  scale: Coords;
  /**
   * Seeds the orbit controls. Must keep its identity while the camera item is
   * unchanged: a new `target` array resets the user's pan.
   */
  orbit: OrbitSpec;
  controls: { rotate: boolean; pan: boolean; zoom: boolean };
  graphics: { id: string; spec: GraphicSpec }[];
};

const DEFAULT_COLOR = "3090ff";

/** `#rrggbb` to RGBA in [0, 1]; anything else (e.g. a gradient name) falls back to the default blue. */
export const parseColor = (text: string, opacity: number): RGBA => {
  const match = /^#?([0-9a-f]{6})$/i.exec(text.trim());
  const hex = match ? match[1] : DEFAULT_COLOR;
  const channel = (i: number) =>
    parseInt(hex.slice(2 * i, 2 * i + 2), 16) / 255;
  const alpha = Number.isFinite(opacity)
    ? Math.min(Math.max(opacity, 0), 1)
    : 1;
  return [channel(0), channel(1), channel(2), alpha];
};
