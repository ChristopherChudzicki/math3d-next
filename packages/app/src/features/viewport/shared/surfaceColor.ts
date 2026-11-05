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

export { explicitColorFunc };
export type { SurfaceColorFunc };
