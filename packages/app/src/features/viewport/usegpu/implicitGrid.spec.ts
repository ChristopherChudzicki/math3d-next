import type { AxesRange } from "@math3d/viewport-spec";
import {
  MAX_IMPLICIT_CELLS,
  gradientFromGrid,
  implicitGridLayout,
  nudgeZero,
} from "./implicitGrid";

test("nudgeZero makes ±0 slightly negative and leaves other values alone", () => {
  expect(nudgeZero(0)).toBe(-1e-20);
  expect(nudgeZero(-0)).toBe(-1e-20);
  expect(nudgeZero(0.25)).toBe(0.25);
  expect(nudgeZero(NaN)).toBeNaN();
});

test("a linear field has its exact normalized gradient at every grid point", () => {
  const size: [number, number, number] = [3, 4, 5];
  const spacing: [number, number, number] = [1, 0.5, 2];
  const values = new Float32Array(3 * 4 * 5);
  for (let k = 0; k < 5; k += 1) {
    for (let j = 0; j < 4; j += 1) {
      for (let i = 0; i < 3; i += 1) {
        const [x, y, z] = [i * spacing[0], j * spacing[1], k * spacing[2]];
        values[i + 3 * (j + 4 * k)] = x + 2 * y + 3 * z;
      }
    }
  }
  const expected = Array.from(
    new Float32Array([1, 2, 3, 0].map((v) => v / Math.sqrt(14))),
  );
  const n = gradientFromGrid(values, size, spacing);
  for (let c = 0; c < values.length; c += 1) {
    expect(Array.from(n.slice(4 * c, 4 * c + 4))).toEqual(expected);
  }
});

test("a NaN neighbor yields the fallback normal", () => {
  const values = new Float32Array(27).map((_, i) => 2 * (i % 3)); // f = 2x
  values[12] = NaN;
  const n = gradientFromGrid(values, [3, 3, 3], [1, 1, 1]);
  expect(Array.from(n.slice(52, 56))).toEqual([0, 0, 1, 0]);
});

test("a constant field, whose gradient is zero, yields the fallback normal", () => {
  const values = new Float32Array(27).fill(1);
  const n = gradientFromGrid(values, [3, 3, 3], [1, 1, 1]);
  expect(Array.from(n.slice(0, 4))).toEqual([0, 0, 1, 0]);
});

test("samples counts cells per axis, capped at MAX_IMPLICIT_CELLS", () => {
  const domain: AxesRange = [
    [0, 4],
    [-1, 1],
    [2, 10],
  ];
  expect(implicitGridLayout(4, domain)).toEqual({
    size: [5, 5, 5],
    spacing: [1, 0.5, 2],
  });
  const n = MAX_IMPLICIT_CELLS;
  expect(implicitGridLayout(n + 1, domain)).toEqual({
    size: [n + 1, n + 1, n + 1],
    spacing: [4 / n, 2 / n, 8 / n],
  });
});
