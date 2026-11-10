import type { Coords } from "@math3d/viewport-spec";
import { strideOf } from "./Instances";
import type { Layout } from "./Instances";

/**
 * What `packSegments` writes per segment: the point before it, its two ends
 * and the point after it, then its path's first, middle and last points.
 */
export const SEGMENT_LAYOUT = [
  ["segmentBefore", 3],
  ["segmentA", 3],
  ["segmentB", 3],
  ["segmentAfter", 3],
  ["pathStart", 3],
  ["pathMiddle", 3],
  ["pathEnd", 3],
] as const satisfies Layout;

/**
 * What `packArrows` writes per arrowhead: its tip, the path's next point in
 * from the tip, then the path's middle point and far end.
 */
export const ARROW_LAYOUT = [
  ["arrowTip", 3],
  ["arrowNeighbor", 3],
  ["pathMiddle", 3],
  ["pathFar", 3],
] as const satisfies Layout;

export const SEGMENT_STRIDE = strideOf(SEGMENT_LAYOUT);
export const ARROW_STRIDE = strideOf(ARROW_LAYOUT);

export type ArrowEnds = { start: boolean; end: boolean };

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

// MathBox samples index (n - 1) / 2 with nearest filtering: a texel boundary
// when n is even, taken here as the later texel.
const middle = (path: Coords[]) => path[Math.floor(path.length / 2)];

/** An upper bound on what `packSegments` writes. */
export const countSegments = (paths: Coords[][]): number =>
  paths.reduce((count, path) => count + Math.max(path.length - 1, 0), 0);

/** An upper bound on what `packArrows` writes. */
export const countArrows = (paths: Coords[][], ends: ArrowEnds): number =>
  (Number(ends.start) + Number(ends.end)) * paths.length;

/**
 * Writes one instance per segment whose ends are both finite, and returns
 * how many. A segment that starts its path, or follows a non-finite point,
 * repeats its own first point as the point before it, which the shader reads
 * as "no join here"; likewise at its other end.
 */
export const packSegments = (paths: Coords[][], out: Float32Array): number => {
  let offset = 0;
  paths.forEach((path) => {
    const last = path.length - 1;
    for (let i = 0; i < last; i += 1) {
      const a = path[i];
      const b = path[i + 1];
      if (isDrawable(a) && isDrawable(b)) {
        const before = i > 0 && isDrawable(path[i - 1]) ? path[i - 1] : a;
        const after =
          i + 2 <= last && isDrawable(path[i + 2]) ? path[i + 2] : b;
        offset = put(out, offset, before);
        offset = put(out, offset, a);
        offset = put(out, offset, b);
        offset = put(out, offset, after);
        offset = put(out, offset, path[0]);
        offset = put(out, offset, middle(path));
        offset = put(out, offset, path[last]);
      }
    }
  });
  return offset / SEGMENT_STRIDE;
};

/**
 * Writes one instance per arrowhead, at each path's first and last point as
 * `ends` asks, and returns how many. A head whose tip or neighboring point
 * is not finite is left out.
 */
export const packArrows = (
  paths: Coords[][],
  ends: ArrowEnds,
  out: Float32Array,
): number => {
  let offset = 0;
  const head = (path: Coords[], tip: number, neighbor: number, far: number) => {
    if (!isDrawable(path[tip]) || !isDrawable(path[neighbor])) return;
    offset = put(out, offset, path[tip]);
    offset = put(out, offset, path[neighbor]);
    offset = put(out, offset, middle(path));
    offset = put(out, offset, path[far]);
  };
  paths.forEach((path) => {
    const last = path.length - 1;
    if (last < 1) return;
    if (ends.end) head(path, last, last - 1, 0);
    if (ends.start) head(path, 0, 1, last);
  });
  return offset / ARROW_STRIDE;
};
