import tinycolor from "tinycolor2";

type SurfaceColorFunc = (
  x: number,
  y: number,
  z: number,
  u: number,
  v: number,
) => number;

/**
 * An explicit surface's color function takes only `(x, y, z)`; its surface
 * parameters are x and y. Called with five arguments, it would throw.
 */
const explicitColorFunc =
  (color: (x: number, y: number, z: number) => number): SurfaceColorFunc =>
  (x, y, z) =>
    color(x, y, z);

/**
 * A solid-colored surface's gridline color, as math3d-react drew it: the
 * surface color with its HSL lightness L scaled by 1 − 0.75·(1 − L).
 */
const gridlineColor = (color: string): string => {
  const hsl = tinycolor(color).toHsl();
  return tinycolor({
    ...hsl,
    l: hsl.l * (1 - 0.75 * (1 - hsl.l)),
  }).toHexString();
};

/** ε in `SurfaceColor`'s `wrap` rule (`@math3d/viewport-spec`). */
const WRAP_TOLERANCE = 1e-4;

/** A color map's position in [0, 1] for value `t`, by `SurfaceColor`'s `wrap` rule. */
const colorMapValue = (t: number, wrap: boolean): number => {
  if (!Number.isFinite(t)) return 0;
  const inside = t >= -WRAP_TOLERANCE && t <= 1 + WRAP_TOLERANCE;
  if (wrap && !inside) return t - Math.floor(t);
  return Math.min(Math.max(t, 0), 1);
};

export { colorMapValue, explicitColorFunc, gridlineColor };
export type { SurfaceColorFunc };
