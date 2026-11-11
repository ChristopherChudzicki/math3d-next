import type { Coords } from "@math3d/viewport-spec";

export const isDrawable = (point: Coords) =>
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]) &&
  Number.isFinite(point[2]);

/**
 * Writes a point at `offset` and returns the offset after it. Indexed
 * access: destructuring and `TypedArray.set` are both measurably slower when
 * a slider refills thousands of points per frame.
 */
export const put = (out: Float32Array, offset: number, point: Coords) => {
  /* eslint-disable no-param-reassign, prefer-destructuring */
  out[offset] = point[0];
  out[offset + 1] = point[1];
  out[offset + 2] = point[2];
  /* eslint-enable no-param-reassign, prefer-destructuring */
  return offset + 3;
};
