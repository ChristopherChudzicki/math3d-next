import type { Coords, RGBA } from "@math3d/viewport-spec";

/**
 * A surface sampled on a `cols` × `rows` grid over [0, 1]²: point (i, j) is
 * at `points[j * cols + i]`, sampled at u = i / (cols - 1), v = j / (rows - 1).
 */
export type Grid = { cols: number; rows: number; points: Coords[] };

const parameter = (index: number, count: number) =>
  count > 1 ? index / (count - 1) : 0;

export const sampleGrid = (
  [cols, rows]: [number, number],
  position: (u: number, v: number) => Coords,
): Grid => {
  const points: Coords[] = new Array(cols * rows);
  for (let j = 0; j < rows; j += 1) {
    const v = parameter(j, rows);
    for (let i = 0; i < cols; i += 1) {
      points[j * cols + i] = position(parameter(i, cols), v);
    }
  }
  return { cols, rows, points };
};

// Indexed writes, as in `stroke/packPaths.ts`: this runs on every refill.
/* eslint-disable no-param-reassign, prefer-destructuring */

export const writePositions = ({ points }: Grid, out: Float32Array): void => {
  for (let k = 0; k < points.length; k += 1) {
    const point = points[k];
    out[3 * k] = point[0];
    out[3 * k + 1] = point[1];
    out[3 * k + 2] = point[2];
  }
};

/** Writes each point's RGBA and returns whether any is translucent. */
export const writeColors = (
  { cols, rows }: Grid,
  colorAt: (u: number, v: number) => RGBA,
  out: Float32Array,
): boolean => {
  let translucent = false;
  for (let j = 0; j < rows; j += 1) {
    const v = parameter(j, rows);
    for (let i = 0; i < cols; i += 1) {
      const color = colorAt(parameter(i, cols), v);
      const k = 4 * (j * cols + i);
      out[k] = color[0];
      out[k + 1] = color[1];
      out[k + 2] = color[2];
      out[k + 3] = color[3];
      if (color[3] < 1) translucent = true;
    }
  }
  return translucent;
};

/**
 * Writes MathBox's surface normals, up to sign: the unit cross product of the
 * steps to the next point along u and along v, a step at the grid's far edge
 * mirroring the one before it. Zero where that is zero or not finite.
 */
export const writeNormals = (
  { cols, rows, points }: Grid,
  out: Float32Array,
): void => {
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      const uTo = points[i < cols - 1 ? k + 1 : k];
      const uFrom = points[i < cols - 1 ? k : k - 1];
      const vTo = points[j < rows - 1 ? k + cols : k];
      const vFrom = points[j < rows - 1 ? k : k - cols];
      const du0 = uTo[0] - uFrom[0];
      const du1 = uTo[1] - uFrom[1];
      const du2 = uTo[2] - uFrom[2];
      const dv0 = vTo[0] - vFrom[0];
      const dv1 = vTo[1] - vFrom[1];
      const dv2 = vTo[2] - vFrom[2];
      const x = du1 * dv2 - du2 * dv1;
      const y = du2 * dv0 - du0 * dv2;
      const z = du0 * dv1 - du1 * dv0;
      const norm = Math.sqrt(x * x + y * y + z * z);
      const valid = norm > 0 && Number.isFinite(norm);
      out[3 * k] = valid ? x / norm : 0;
      out[3 * k + 1] = valid ? y / norm : 0;
      out[3 * k + 2] = valid ? z / norm : 0;
    }
  }
};

/**
 * Writes two triangles per cell and returns how many indices. MathBox's
 * order and winding: three draws a translucent mesh's back faces first, so
 * the winding decides how a translucent surface overlaps itself.
 */
export const writeIndex = (cols: number, rows: number, out: Uint32Array) => {
  let n = 0;
  for (let j = 0; j < rows - 1; j += 1) {
    for (let i = 0; i < cols - 1; i += 1) {
      const a = j * cols + i;
      const right = a + 1;
      const up = a + cols;
      out[n] = a;
      out[n + 1] = right;
      out[n + 2] = up;
      out[n + 3] = up;
      out[n + 4] = right;
      out[n + 5] = up + 1;
      n += 6;
    }
  }
  return n;
};

/* eslint-enable no-param-reassign, prefer-destructuring */

// MathBox resamples the grid with nearest filtering, so each gridline lies
// on the sample row or column nearest its even spacing.
const nearestLine = (line: number, lineCount: number, sampleCount: number) =>
  lineCount > 1
    ? Math.floor((line * (sampleCount - 1)) / (lineCount - 1) + 0.5)
    : 0;

/**
 * Gridlines along sampled columns and rows: `uLines` at fixed u, each
 * running along v, then `vLines` at fixed v, each running along u.
 */
export const isolines = (
  { cols, rows, points }: Grid,
  [uLines, vLines]: [number, number],
): Coords[][] => {
  const paths: Coords[][] = [];
  for (let line = 0; line < uLines; line += 1) {
    const i = nearestLine(line, uLines, cols);
    const path: Coords[] = new Array(rows);
    for (let j = 0; j < rows; j += 1) path[j] = points[j * cols + i];
    paths.push(path);
  }
  for (let line = 0; line < vLines; line += 1) {
    const j = nearestLine(line, vLines, rows);
    paths.push(points.slice(j * cols, (j + 1) * cols));
  }
  return paths;
};
