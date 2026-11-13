import type { Coords, RGBA } from "@math3d/viewport-spec";

/**
 * A surface sampled on a `cols` × `rows` grid over [0, 1]², each at least 2:
 * point (i, j) is at `points[j * cols + i]`, sampled at u = i / (cols - 1),
 * v = j / (rows - 1).
 */
export type ParametricGrid = { cols: number; rows: number; points: Coords[] };

const parameter = (index: number, count: number) => index / (count - 1);

export const sampleGrid = (
  [cols, rows]: [number, number],
  position: (u: number, v: number) => Coords,
): ParametricGrid => {
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

export const writePositions = (
  { points }: ParametricGrid,
  out: Float32Array,
): void => {
  for (let k = 0; k < points.length; k += 1) {
    const point = points[k];
    out[3 * k] = point[0];
    out[3 * k + 1] = point[1];
    out[3 * k + 2] = point[2];
  }
};

export const writeParameters = (
  { cols, rows }: ParametricGrid,
  out: Float32Array,
): void => {
  for (let j = 0; j < rows; j += 1) {
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      out[2 * k] = parameter(i, cols);
      out[2 * k + 1] = parameter(j, rows);
    }
  }
};

export const writeColors = (
  { cols, rows }: ParametricGrid,
  colorAt: (u: number, v: number) => RGBA,
  out: Float32Array,
): void => {
  for (let j = 0; j < rows; j += 1) {
    const v = parameter(j, rows);
    for (let i = 0; i < cols; i += 1) {
      const color = colorAt(parameter(i, cols), v);
      const k = 4 * (j * cols + i);
      out[k] = color[0];
      out[k + 1] = color[1];
      out[k + 2] = color[2];
      out[k + 3] = color[3];
    }
  }
};

/**
 * Writes MathBox's surface normals: the unit cross product of the steps to
 * the next point along v and along u, a step at the grid's far edge
 * repeating the one before it. Zero where that is zero or not finite.
 */
export const writeNormals = (
  { cols, rows, points }: ParametricGrid,
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
      const x = dv1 * du2 - dv2 * du1;
      const y = dv2 * du0 - dv0 * du2;
      const z = dv0 * du1 - dv1 * du0;
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
 * order and winding (clockwise about `writeNormals`' normals): three draws a
 * translucent mesh's back faces first, so the winding decides how a
 * translucent surface overlaps itself.
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

/**
 * Whether the grid's first and last columns (u) and rows (v) coincide, as a
 * torus's do at its seams: there, each edge gridline is half of one line.
 */
export const closedAxes = ({
  cols,
  rows,
  points,
}: ParametricGrid): [boolean, boolean] => {
  let extent = 0;
  points.forEach((point) =>
    point.forEach((x) => {
      if (Number.isFinite(x)) extent = Math.max(extent, Math.abs(x));
    }),
  );
  const tolerance = 1e-6 * extent;
  // Two samples undefined alike count as the same, so a row a surface of
  // revolution leaves undefined doesn't open its seam.
  const same = (a: number, b: number) =>
    points[a].every((x, k) => {
      const y = points[b][k];
      return Number.isFinite(x) || Number.isFinite(y)
        ? Math.abs(x - y) <= tolerance
        : true;
    });
  let u = true;
  for (let j = 0; j < rows && u; j += 1)
    u = same(j * cols, j * cols + cols - 1);
  let v = true;
  for (let i = 0; i < cols && v; i += 1) v = same(i, (rows - 1) * cols + i);
  return [u, v];
};
