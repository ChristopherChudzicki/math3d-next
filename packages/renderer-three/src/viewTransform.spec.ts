import { expect, test } from "vitest";
import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { mathToView } from "./viewTransform";

test("each axis's range maps onto [-scale, scale]", () => {
  const range: AxesRange = [
    [-5, 5],
    [0, 10],
    [-1, 3],
  ];
  const viewScale: Coords = [1, 2, 0.5];
  const { scale, offset } = mathToView(range, viewScale);

  const toView = (math: Coords) => math.map((v, i) => v * scale[i] + offset[i]);

  expect(toView([-5, 0, -1])).toEqual([-1, -2, -0.5]);
  expect(toView([5, 10, 3])).toEqual([1, 2, 0.5]);
});

test("a zero-width range spans [min, min + 1], as in MathBox", () => {
  const range: AxesRange = [
    [-5, 5],
    [0, 10],
    [2, 2],
  ];
  const { scale, offset } = mathToView(range, [1, 1, 1]);

  expect(2 * scale[2] + offset[2]).toBe(-1);
  expect(3 * scale[2] + offset[2]).toBe(1);
});
