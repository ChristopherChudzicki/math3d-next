import type { AxesRange, Coords } from "@math3d/viewport-spec";

/**
 * A scalar field sampled at evenly spaced points of a box. Point (i, j, k)
 * is at `origin + [i, j, k] * spacing`, its value at
 * `values[i + nx * (j + ny * k)]`.
 */
export type ScalarGrid = {
  /** Points per axis: [nx, ny, nz]. */
  size: [number, number, number];
  origin: Coords;
  spacing: Coords;
  /** May be longer than the grid; only its first nx·ny·nz entries count. */
  values: Float32Array;
};

// One buffer for every grid: a grid is meshed before the next is sampled.
let scratch = new Float32Array(0);

/**
 * Samples `value` at the corners of `cells` cells per axis over `domain`,
 * both ends included. The grid's `values` are overwritten by the next call.
 */
export const sampleScalarGrid = (
  cells: number,
  domain: AxesRange,
  value: (x: number, y: number, z: number) => number,
): ScalarGrid => {
  const n = cells + 1;
  if (scratch.length < n * n * n) scratch = new Float32Array(n * n * n);
  const [[x0, x1], [y0, y1], [z0, z1]] = domain;
  let c = 0;
  for (let k = 0; k < n; k += 1) {
    const z = z0 + ((z1 - z0) * k) / cells;
    for (let j = 0; j < n; j += 1) {
      const y = y0 + ((y1 - y0) * j) / cells;
      for (let i = 0; i < n; i += 1) {
        scratch[c] = value(x0 + ((x1 - x0) * i) / cells, y, z);
        c += 1;
      }
    }
  }
  return {
    size: [n, n, n],
    origin: [x0, y0, z0],
    spacing: [(x1 - x0) / cells, (y1 - y0) / cells, (z1 - z0) / cells],
    values: scratch,
  };
};

/**
 * Writes the field's gradient at point (i, j, k) to `out[at..at + 2]`:
 * central differences, one-sided at the grid's faces.
 */
export const writeGradient = (
  { size: [nx, ny, nz], spacing: [hx, hy, hz], values }: ScalarGrid,
  i: number,
  j: number,
  k: number,
  out: Float64Array,
  at: number,
): void => {
  const c = i + nx * (j + ny * k);
  const sz = nx * ny;
  const iLo = i > 0 ? 1 : 0;
  const iHi = i < nx - 1 ? 1 : 0;
  const jLo = j > 0 ? nx : 0;
  const jHi = j < ny - 1 ? nx : 0;
  const kLo = k > 0 ? sz : 0;
  const kHi = k < nz - 1 ? sz : 0;
  /* eslint-disable no-param-reassign */
  out[at] = (values[c + iHi] - values[c - iLo]) / ((iLo + iHi) * hx);
  out[at + 1] = (values[c + jHi] - values[c - jLo]) / (((jLo + jHi) / nx) * hy);
  out[at + 2] = (values[c + kHi] - values[c - kLo]) / (((kLo + kHi) / sz) * hz);
  /* eslint-enable no-param-reassign */
};
