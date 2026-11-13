/**
 * What each graphic draws, in math-item terms: evaluated positions, RGBA
 * colors, sample callbacks. The app's viewport/spec components read the store
 * and MathScope and produce these; a renderer that draws from specs (three.js)
 * turns them into its own scene, while MathBox reads math items directly.
 *
 * Positions are in math coordinates, as the items evaluate them; only
 * `CameraSpec` is in view coordinates. Pixel quantities (`width`, `size`) are
 * CSS pixels as MathBox draws them: exact at one view unit from the camera,
 * and scaled with distance like anything else in a perspective view.
 */
import type { AxesRange, Coords } from "./coordinates";

export type RGBA = [number, number, number, number];

type Common = {
  /** MathBox-style depth bias. Each renderer has one; their scales are not calibrated against each other. */
  zBias: number;
  /**
   * MathBox squeezes a higher zIndex's depth toward the near plane, so it draws
   * over lower ones. Other renderers approximate that; see each renderer's
   * coverage table.
   */
  zIndex: number;
};

export type PointSpec = Common & {
  kind: "point";
  positions: Coords[];
  /** Point diameter, in CSS pixels. */
  size: number;
  color: RGBA;
  /** Drawn at each point; `null` when hidden or empty. */
  label: string | null;
};

export type LineSpec = Common & {
  kind: "line";
  paths: Coords[][];
  /** Line width, in CSS pixels. */
  width: number;
  color: RGBA;
  /** Arrowheads at each path's first and last point. */
  start: boolean;
  end: boolean;
  /**
   * Arrowhead base width, in line widths; the head is a 2.5 : 1 cone, so
   * 1.25 × this long.
   */
  arrowSize: number;
  /** Drawn at the last point; `null` when hidden or empty. */
  label: string | null;
};

export type SurfaceSpec = Common & {
  kind: "surface";
  /** Sample counts along the two parameters, each at least 2. */
  samples: [number, number];
  /** Position at normalized parameters in [0, 1]². */
  position: (u: number, v: number) => Coords;
  /** Color (with opacity) at normalized parameters in [0, 1]². */
  colorAt: (u: number, v: number) => RGBA;
  shaded: boolean;
  grid: {
    /** Gridlines along each parameter: 0 for none, else at least 2. */
    lines: [number, number];
    width: number;
    /** three.js uses only the alpha, drawing lines in contrast to the surface. */
    color: RGBA;
  };
};

export type ImplicitSurfaceSpec = Common & {
  kind: "implicit";
  domain: AxesRange;
  /** Cells per axis, as in MathBox. */
  samples: number;
  /**
   * The surface is the zero level set of this function. A renderer may skip
   * sampling when a spec has the same function as the last (as when a
   * variable drives only the opacity); a new function for the same surface
   * costs that speed and nothing else.
   */
  value: (x: number, y: number, z: number) => number;
  color: RGBA;
  shaded: boolean;
};

export type AxisSpec = Common & {
  kind: "axis";
  axis: "x" | "y" | "z";
  /** Line width, in CSS pixels. */
  width: number;
  color: RGBA;
  /** Arrowheads at the axis's low and high end. */
  start: boolean;
  end: boolean;
  /** Arrowhead base width, in line widths, as in `LineSpec`. */
  arrowSize: number;
  range: [number, number];
  ticks: {
    divisions: number;
    visible: boolean;
    /** Where ticks go: the app's `linearTicks` over `range`, without zero. */
    values: number[];
  };
  /** Drawn at the axis end; `null` when hidden or empty. */
  label: string | null;
};

export type GridSpec = Common & {
  kind: "grid";
  axes: "xy" | "yz" | "zx";
  /** The range of each of `axes`, which every gridline spans. */
  range: [[number, number], [number, number]];
  divisions: [number, number];
  /** Snap gridlines to round values instead of dividing the range evenly. */
  snap: boolean;
  /**
   * Where gridlines cross each of `axes`: `values[0]` along the first, each
   * a line parallel to the second, and the other way round.
   */
  values: [number[], number[]];
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
   * In view coordinates: the axes' range mapped onto [-scale, scale], z up.
   * The app's `fromUi` converts the camera item's `position`/`target` into them.
   */
  position: Coords;
  target: Coords;
};
