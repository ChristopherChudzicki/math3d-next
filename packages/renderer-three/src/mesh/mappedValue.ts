/**
 * A vertex whose value changes by at most this along each edge meeting it
 * looks its map up per pixel.
 */
export const LOOKUP_CHANGE = 0.2;

/**
 * A vertex whose value changes by at least this along some edge meeting it
 * blends its vertex colors: a change this large may be a jump, and a jump
 * looked up per pixel sweeps the map across one cell.
 */
export const BLEND_CHANGE = 0.3;

const clampedValue = (value: number) =>
  Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : NaN;

const weightOf = (change: number) => {
  // A change that isn't finite counts as over the threshold.
  if (!(change < BLEND_CHANGE)) return 1;
  if (change <= LOOKUP_CHANGE) return 0;
  return (change - LOOKUP_CHANGE) / (BLEND_CHANGE - LOOKUP_CHANGE);
};

/**
 * Writes each vertex of a `cols` × `rows` grid's value, clamped to [0, 1]
 * (0 where it isn't finite), and its weight toward the vertex color, from the
 * largest change in clamped value along the edges meeting it: the grid's and
 * the diagonal `writeIndex` splits each cell along.
 */
export const writeMappedValues = (
  values: ArrayLike<number>,
  cols: number,
  rows: number,
  out: Float32Array,
): void => {
  const clamped = Float64Array.from(values, clampedValue);
  // Grid neighbors, then the diagonal's ends: (i - 1, j + 1) and (i + 1, j - 1).
  const offsets = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, 1],
    [1, -1],
  ];
  /* eslint-disable no-param-reassign */
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      let change = 0;
      offsets.forEach(([di, dj]) => {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || ni >= cols || nj < 0 || nj >= rows) return;
        // `Math.max` keeps NaN, so a change that isn't finite sticks.
        change = Math.max(
          change,
          Math.abs(clamped[k] - clamped[nj * cols + ni]),
        );
      });
      out[2 * k] = Number.isNaN(clamped[k]) ? 0 : clamped[k];
      out[2 * k + 1] = weightOf(change);
    }
  }
  /* eslint-enable no-param-reassign */
};
