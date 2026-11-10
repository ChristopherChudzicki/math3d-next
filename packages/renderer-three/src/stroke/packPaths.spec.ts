import { describe, expect, test } from "vitest";
import type { Coords } from "@math3d/viewport-spec";
import {
  ARROW_STRIDE,
  SEGMENT_STRIDE,
  packArrows,
  packSegments,
} from "./packPaths";

const P: Coords[] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 2, 0],
  [1, 2, 3],
  [4, 2, 3],
];

/** What a pack function wrote, as one array of points per instance. */
const packed = (
  stride: number,
  pack: (out: Float32Array) => number,
): Coords[][] => {
  const out = new Float32Array(stride * 16);
  const floats = pack(out) * stride;
  const points: number[][] = [];
  for (let i = 0; i < floats; i += 3) {
    points.push(Array.from(out.subarray(i, i + 3)));
  }
  const perInstance = stride / 3;
  return Array.from({ length: points.length / perInstance }, (_, i) =>
    points.slice(i * perInstance, (i + 1) * perInstance),
  ) as Coords[][];
};

const segments = (paths: Coords[][]) =>
  packed(SEGMENT_STRIDE, (out) => packSegments(paths, out));

const arrows = (paths: Coords[][], ends: { start: boolean; end: boolean }) =>
  packed(ARROW_STRIDE, (out) => packArrows(paths, ends, out));

describe("packSegments", () => {
  test("writes each segment with its neighbors and its path's start, middle and end", () => {
    const path = P.slice(0, 4);
    const [start, , middle, end] = path;
    expect(segments([path])).toEqual([
      [P[0], P[0], P[1], P[2], start, middle, end],
      [P[0], P[1], P[2], P[3], start, middle, end],
      [P[1], P[2], P[3], P[3], start, middle, end],
    ]);
  });

  test("joins no segment to another path's", () => {
    const first = [P[0], P[1]];
    const second = [P[2], P[3]];
    expect(segments([first, second])).toEqual([
      [P[0], P[0], P[1], P[1], P[0], P[1], P[1]],
      [P[2], P[2], P[3], P[3], P[2], P[3], P[3]],
    ]);
  });

  test("drops the segments at a non-finite point and ends its neighbors there", () => {
    const gap: Coords = [NaN, 0, 0];
    const path = [P[0], P[1], gap, P[3], P[4]];
    expect(segments([path]).map((segment) => segment.slice(0, 4))).toEqual([
      [P[0], P[0], P[1], P[1]],
      [P[3], P[3], P[4], P[4]],
    ]);
  });
});

describe("packArrows", () => {
  const [first, second, middle, beforeLast, last] = P;

  test("an end arrowhead points along the last segment", () => {
    expect(arrows([P], { start: false, end: true })).toEqual([
      [last, beforeLast, middle, first],
    ]);
  });

  test("a start arrowhead points back along the first segment", () => {
    expect(arrows([P], { start: true, end: false })).toEqual([
      [first, second, middle, last],
    ]);
  });

  test("a path with a single point gets none", () => {
    expect(arrows([[first]], { start: true, end: true })).toEqual([]);
  });

  test.each<{ name: string; path: Coords[] }>([
    { name: "tip", path: [first, second, [Infinity, 0, 0]] },
    { name: "neighbor", path: [first, [Infinity, 0, 0], last] },
  ])("a head with a non-finite $name is left out", ({ path }) => {
    expect(arrows([path], { start: false, end: true })).toEqual([]);
  });
});
