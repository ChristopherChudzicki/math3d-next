/**
 * A vertex whose value changes by at most this along each edge meeting it
 * looks its map up per pixel.
 */
const LOOKUP_MAX_CHANGE = 0.2;

/**
 * A vertex whose value changes by at least this along some edge meeting it
 * blends its vertex colors: a change this large may be a jump, and a jump
 * looked up per pixel sweeps the map across one cell.
 */
const BLEND_MIN_CHANGE = 0.3;

const weightOf = (change: number) => {
  if (!(change < BLEND_MIN_CHANGE)) return 1;
  if (change <= LOOKUP_MAX_CHANGE) return 0;
  return (change - LOOKUP_MAX_CHANGE) / (BLEND_MIN_CHANGE - LOOKUP_MAX_CHANGE);
};

// Grid neighbors, then the diagonal's ends: (i - 1, j + 1) and (i + 1, j - 1).
const OFFSETS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
  [-1, 1],
  [1, -1],
];

/* eslint-disable no-param-reassign */

/** Gives the weights at `a` and `b`, one vertex at a seam, the larger of the two. */
const joinWeights = (out: Float32Array, a: number, b: number) => {
  const weight = Math.max(out[2 * a + 1], out[2 * b + 1]);
  out[2 * a + 1] = weight;
  out[2 * b + 1] = weight;
};

/**
 * Writes, per vertex of a `cols` × `rows` grid, its value clamped to [0, 1]
 * (0 where it is NaN) and its weight toward the vertex color, from the
 * largest change in clamped value along the edges meeting it: the grid's, and
 * the diagonal `writeIndex` splits each cell along. On a `closed` axis, the
 * two copies of a seam vertex take the larger of their weights.
 */
export const writeMappedValues = (
  values: ArrayLike<number>,
  cols: number,
  rows: number,
  closed: readonly [boolean, boolean],
  out: Float32Array,
): void => {
  const clamped = new Float64Array(values.length);
  for (let k = 0; k < values.length; k += 1) {
    clamped[k] = Math.min(Math.max(values[k], 0), 1);
  }
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      let change = 0;
      for (let n = 0; n < OFFSETS.length; n += 1) {
        const ni = i + OFFSETS[n][0];
        const nj = j + OFFSETS[n][1];
        if (ni >= 0 && ni < cols && nj >= 0 && nj < rows) {
          // `Math.max` keeps NaN, and `weightOf(NaN)` is 1.
          change = Math.max(
            change,
            Math.abs(clamped[k] - clamped[nj * cols + ni]),
          );
        }
      }
      out[2 * k] = Number.isNaN(clamped[k]) ? 0 : clamped[k];
      out[2 * k + 1] = weightOf(change);
    }
  }
  if (closed[0]) {
    for (let j = 0; j < rows; j += 1)
      joinWeights(out, j * cols, j * cols + cols - 1);
  }
  if (closed[1]) {
    for (let i = 0; i < cols; i += 1)
      joinWeights(out, i, (rows - 1) * cols + i);
  }
};

/* eslint-enable no-param-reassign */
