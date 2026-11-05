/**
 * What each graphic draws, in math-item terms: evaluated positions, RGBA
 * colors, sample callbacks. The components in this folder read the store and
 * MathScope and produce these; usegpu/live turns them into a Live tree.
 */
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";

export type RGBA = [number, number, number, number];

type Common = {
  /** MathBox-style depth bias. Both renderers have one; their scales are not calibrated against each other. */
  zBias: number;
  /**
   * MathBox squeezes a higher zIndex's depth toward the near plane, so it draws
   * over lower ones. Use.GPU only orders draw calls by it, where a component
   * accepts it; see `usegpu/coverage.ts`.
   */
  zIndex: number;
};

export type PointSpec = Common & {
  kind: "point";
  positions: Coords[];
  size: number;
  color: RGBA;
  /** Drawn at each point; `null` when hidden or empty. */
  label: string | null;
};

export type LineSpec = Common & {
  kind: "line";
  paths: Coords[][];
  width: number;
  color: RGBA;
  start: boolean;
  end: boolean;
  arrowSize: number;
  /** Drawn at the last point; `null` when hidden or empty. */
  label: string | null;
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
  domain: AxesRange;
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
  range: [number, number];
  ticks: { divisions: number; visible: boolean };
  /** Drawn at the axis end; `null` when hidden or empty. */
  label: string | null;
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
