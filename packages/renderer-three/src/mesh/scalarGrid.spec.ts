import { expect, test } from "vitest";
import type { AxesRange } from "@math3d/viewport-spec";
import { sampleScalarGrid, writeGradient } from "./scalarGrid";

const domain: AxesRange = [
  [0, 4],
  [-1, 1],
  [2, 10],
];

test("samples the corners of the cells, both ends of the domain included, x fastest", () => {
  const grid = sampleScalarGrid(2, domain, (x, y, z) => x + 10 * y + 100 * z);
  expect(grid).toMatchObject({
    size: [3, 3, 3],
    origin: [0, -1, 2],
    spacing: [2, 1, 4],
  });
  expect(Array.from(grid.values.subarray(0, 4))).toEqual([190, 192, 194, 200]);
  expect(grid.values[26]).toBe(4 + 10 + 1000);
});

test("a linear field has its exact gradient at every grid point, the faces included", () => {
  // Four cells per axis: every sample is exact in a float32.
  const grid = sampleScalarGrid(4, domain, (x, y, z) => x + 2 * y + 3 * z);
  const out = new Float64Array(4);
  for (let k = 0; k < 5; k += 1) {
    for (let j = 0; j < 5; j += 1) {
      for (let i = 0; i < 5; i += 1) {
        writeGradient(grid, i, j, k, out, 1);
        expect(Array.from(out)).toEqual([0, 1, 2, 3]);
      }
    }
  }
});

test("steps over a non-finite sample: its neighbours keep the exact gradient", () => {
  const grid = sampleScalarGrid(4, domain, (x, y, z) =>
    x === 2 && y === 0 && z === 6 ? NaN : x + 2 * y + 3 * z,
  );
  const out = new Float64Array(3);
  [
    [1, 2, 2],
    [3, 2, 2],
    [2, 1, 2],
    [2, 3, 2],
    [2, 2, 1],
    [2, 2, 3],
  ].forEach(([i, j, k]) => {
    writeGradient(grid, i, j, k, out, 0);
    expect(Array.from(out)).toEqual([1, 2, 3]);
  });
});
