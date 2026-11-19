import type {
  AxesRange,
  Coords,
  ImplicitSurfaceSpec,
} from "@math3d/viewport-spec";

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
// The coordinates of one z-slab's points, for a spec's `values`.
let slabX = new Float64Array(0);
let slabY = new Float64Array(0);
let slabZ = new Float64Array(0);

/** Frees the buffers grids are sampled into; the next grid allocates anew. */
export const freeGridBuffer = (): void => {
  scratch = new Float32Array(0);
  slabX = new Float64Array(0);
  slabY = new Float64Array(0);
  slabZ = new Float64Array(0);
};

/**
 * Samples `value` at the corners of `cells` cells per axis over `domain`,
 * both ends included. The grid's `values` are overwritten by the next call.
 *
 * With `values`, a z-slab is sampled in one call. The first slab it declines
 * is sampled with `value`, and so is every later one.
 */
export const sampleScalarGrid = (
  cells: number,
  domain: AxesRange,
  value: (x: number, y: number, z: number) => number,
  values?: ImplicitSurfaceSpec["values"],
): ScalarGrid => {
  const n = cells + 1;
  const slab = n * n;
  if (scratch.length < n * slab) scratch = new Float32Array(n * slab);
  const [[x0, x1], [y0, y1], [z0, z1]] = domain;
  let batched = values;
  if (batched) {
    // Exactly one slab long: `values` gives one result per entry.
    if (slabX.length !== slab) {
      slabX = new Float64Array(slab);
      slabY = new Float64Array(slab);
      slabZ = new Float64Array(slab);
    }
    for (let j = 0; j < n; j += 1) {
      const y = y0 + ((y1 - y0) * j) / cells;
      for (let i = 0; i < n; i += 1) {
        slabX[i + n * j] = x0 + ((x1 - x0) * i) / cells;
        slabY[i + n * j] = y;
      }
    }
  }
  for (let k = 0; k < n; k += 1) {
    const z = z0 + ((z1 - z0) * k) / cells;
    const sampled = batched?.(slabX, slabY, slabZ.fill(z));
    if (sampled) {
      scratch.set(sampled.subarray(0, slab), k * slab);
    } else {
      batched = undefined;
      let c = k * slab;
      for (let j = 0; j < n; j += 1) {
        const y = y0 + ((y1 - y0) * j) / cells;
        for (let i = 0; i < n; i += 1) {
          scratch[c] = value(x0 + ((x1 - x0) * i) / cells, y, z);
          c += 1;
        }
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
 * central differences, one-sided where a neighbor is off the grid or not
 * finite.
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
  const iLo = i > 0 && Number.isFinite(values[c - 1]) ? 1 : 0;
  const iHi = i < nx - 1 && Number.isFinite(values[c + 1]) ? 1 : 0;
  const jLo = j > 0 && Number.isFinite(values[c - nx]) ? nx : 0;
  const jHi = j < ny - 1 && Number.isFinite(values[c + nx]) ? nx : 0;
  const kLo = k > 0 && Number.isFinite(values[c - sz]) ? sz : 0;
  const kHi = k < nz - 1 && Number.isFinite(values[c + sz]) ? sz : 0;
  /* eslint-disable no-param-reassign */
  out[at] = (values[c + iHi] - values[c - iLo]) / ((iLo + iHi) * hx);
  out[at + 1] = (values[c + jHi] - values[c - jLo]) / (((jLo + jHi) / nx) * hy);
  out[at + 2] = (values[c + kHi] - values[c - kLo]) / (((kLo + kHi) / sz) * hz);
  /* eslint-enable no-param-reassign */
};
