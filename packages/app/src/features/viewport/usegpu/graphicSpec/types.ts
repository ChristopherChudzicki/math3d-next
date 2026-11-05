/**
 * What each graphic draws, in math-item terms: evaluated positions, RGBA
 * colors, sample callbacks. The components in this folder read the store and
 * MathScope and produce these; usegpu/live turns them into a Live tree.
 */
import tinycolor from "tinycolor2";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";

export type RGBA = [number, number, number, number];

type Common = {
  /** MathBox-style depth bias. Both renderers have one; their scales are not calibrated against each other. */
  zBias: number;
  /** MathBox squeezes a higher zIndex's depth toward the near plane, so it draws over lower ones. */
  zIndex: number;
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

const DEFAULT_COLOR = "#3090ff";

/** Any color tinycolor parses, to RGBA in [0, 1]; anything else (e.g. a gradient name) falls back to the default blue. */
export const parseColor = (text: string, opacity: number): RGBA => {
  const parsed = tinycolor(text);
  const { r, g, b } = (
    parsed.isValid() ? parsed : tinycolor(DEFAULT_COLOR)
  ).toRgb();
  const alpha = Number.isFinite(opacity)
    ? Math.min(Math.max(opacity, 0), 1)
    : 1;
  return [r / 255, g / 255, b / 255, alpha];
};
