import type { Coords, SurfaceSpec } from "@math3d/viewport-spec";
import { writeMappedValues } from "./mappedValue";
import { writePhase } from "./phase";

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

const setColor = (
  out: Float32Array,
  k: number,
  [r, g, b]: readonly number[],
  alpha: number,
) => {
  out[4 * k] = r;
  out[4 * k + 1] = g;
  out[4 * k + 2] = b;
  out[4 * k + 3] = alpha;
};

/**
 * Writes each vertex's RGBA and, for a map color, its `mapValue`: a periodic
 * color's phase, with only alpha in `color`; else `writeMappedValues`'s value
 * and weight. A periodic cell with no finite value draws the map's low end.
 */
export const writeColors = (
  { cols, rows, points }: ParametricGrid,
  { colorAt, mapColor }: Pick<SurfaceSpec, "colorAt" | "mapColor">,
  closed: readonly [boolean, boolean],
  out: { color: Float32Array; mapValue: Float32Array },
): void => {
  const mapped = mapColor && !mapColor.periodic;
  const values = new Float64Array(mapped ? cols * rows : 0);
  for (let j = 0; j < rows; j += 1) {
    const v = parameter(j, rows);
    for (let i = 0; i < cols; i += 1) {
      const k = j * cols + i;
      const u = parameter(i, cols);
      if (!mapColor) {
        const color = colorAt(u, v, points[k]);
        setColor(out.color, k, color, color[3]);
      } else if (mapColor.periodic) {
        writePhase(out.mapValue, k, mapColor.valueAt(u, v, points[k]));
        out.color[4 * k + 3] = mapColor.alpha;
      } else {
        // Equals `colorAt`'s color, without evaluating the expression twice.
        values[k] = mapColor.valueAt(u, v, points[k]);
        setColor(out.color, k, mapColor.map(values[k]), mapColor.alpha);
      }
    }
  }
  if (mapped) writeMappedValues(values, cols, rows, closed, out.mapValue);
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
 * A test of whether the samples at two indices are the same point, to a
 * millionth of the grid's extent. Two samples undefined alike count as the same, so a row
 * a surface of revolution leaves undefined doesn't open its seam.
 */
const samePoint = ({ points }: ParametricGrid) => {
  let extent = 0;
  points.forEach((point) =>
    point.forEach((x) => {
      if (Number.isFinite(x)) extent = Math.max(extent, Math.abs(x));
    }),
  );
  const tolerance = 1e-6 * extent;
  return (a: number, b: number) =>
    points[a].every((x, k) => {
      const y = points[b][k];
      return Number.isFinite(x) || Number.isFinite(y)
        ? Math.abs(x - y) <= tolerance
        : true;
    });
};

/**
 * Whether the grid's first and last columns (u) and rows (v) coincide, as a
 * torus's do at its seams: there, each edge gridline is half of one line.
 */
export const closedAxes = (grid: ParametricGrid): [boolean, boolean] => {
  const { cols, rows } = grid;
  const same = samePoint(grid);
  let u = true;
  for (let j = 0; j < rows && u; j += 1)
    u = same(j * cols, j * cols + cols - 1);
  let v = true;
  for (let i = 0; i < cols && v; i += 1) v = same(i, (rows - 1) * cols + i);
  return [u, v];
};

/**
 * The curve a surface traces when it ignores exactly one parameter, and so
 * has no area: `ignored` is that parameter's axis (0 for u), and `path` the
 * samples along the other. Null otherwise.
 */
export const degenerateCurve = (
  grid: ParametricGrid,
): { ignored: 0 | 1; path: Coords[] } | null => {
  const { cols, rows, points } = grid;
  const same = samePoint(grid);
  let u = true;
  for (let k = 0; k < points.length && u; k += 1) u = same(k, k - (k % cols));
  let v = true;
  for (let k = cols; k < points.length && v; k += 1) v = same(k, k % cols);
  if (u === v) return null;
  return u
    ? {
        ignored: 0,
        path: Array.from({ length: rows }, (_, j) => points[j * cols]),
      }
    : { ignored: 1, path: points.slice(0, cols) };
};
