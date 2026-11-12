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

/**
 * A solid-colored surface's gridline color in the viewport spec (three.js,
 * Use.GPU): its HSL lightness scaled by 0.55, darker than `gridlineColor`,
 * which three.js's glossy shading and order-independent blending wash out.
 */
const specGridlineColor = (color: string): string => {
  const hsl = tinycolor(color).toHsl();
  return tinycolor({ ...hsl, l: 0.55 * hsl.l }).toHexString();
};

export { explicitColorFunc, gridlineColor, specGridlineColor };
export type { SurfaceColorFunc };
