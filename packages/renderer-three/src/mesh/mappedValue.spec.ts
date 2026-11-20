import { expect, test } from "vitest";
import { writeMappedValues } from "./mappedValue";

/** Each vertex's [value, weight] for values given row by row. */
const written = (
  cols: number,
  values: number[],
  closed: [boolean, boolean] = [false, false],
) => {
  const out = new Float32Array(2 * values.length);
  writeMappedValues(values, cols, values.length / cols, closed, out);
  return Array.from({ length: values.length }, (_, k) => [
    out[2 * k],
    out[2 * k + 1],
  ]);
};

const weights = (cols: number, values: number[], closed?: [boolean, boolean]) =>
  written(cols, values, closed).map(([, weight]) => weight);

test("a slope under 0.2 per cell looks up everywhere, sending each value", () => {
  const row = [0, 0.15, 0.3, 0.45];
  const out = written(4, [...row, ...row]);
  expect(out.map(([value]) => value)).toEqual(
    Array.from(new Float32Array([...row, ...row])),
  );
  expect(out.map(([, weight]) => weight)).toEqual(Array(8).fill(0));
});

test("a step over 0.3 blends on both sides of it, and only there", () => {
  const row = [0, 0, 0, 0.5, 0.5];
  expect(weights(5, [...row, ...row])).toEqual([
    ...[0, 0, 1, 1, 0],
    ...[0, 0, 1, 1, 0],
  ]);
});

test("a change between 0.2 and 0.3 weighs in proportion", () => {
  weights(2, [0, 0.22, 0, 0.22]).forEach((weight) =>
    expect(weight).toBeCloseTo(0.2),
  );
});

test("the diagonal each cell is split along counts as an edge", () => {
  // Grid edges change by 0.175; the diagonal from (1, 0) to (0, 1) by 0.35.
  expect(weights(2, [0.175, 0, 0.35, 0.175])).toEqual([0, 1, 1, 0]);
});

test("values compare after clamping to [0, 1]", () => {
  expect(written(2, [1.2, 50, 1, 7])).toEqual(Array(4).fill([1, 0]));
  expect(written(2, [-3, -0.5, 0, -40])).toEqual(Array(4).fill([0, 0]));
});

test("a value of NaN blends itself and every vertex sharing an edge with it, and sends 0", () => {
  const out = written(3, [0.5, 0.5, 0.5, 0.5, NaN, 0.5, 0.5, 0.5, 0.5]);
  expect(out[4]).toEqual([0, 1]);
  // Corners (0, 0) and (2, 2) are off the center's edges and diagonals.
  expect(out.map(([, weight]) => weight)).toEqual([0, 1, 1, 1, 1, 1, 1, 1, 0]);
});

test("on a closed axis, a seam's two copies take the larger weight", () => {
  // A step beside column 0; the last column's neighbor is flat.
  const row = [0, 0.5, 0, 0];
  expect(weights(4, [...row, ...row], [true, false])).toEqual(Array(8).fill(1));
  expect(weights(4, [...row, ...row])).toEqual([
    ...[1, 1, 1, 0],
    ...[1, 1, 1, 0],
  ]);
});

test("with both axes closed, a torus's four corners agree", () => {
  // A step at (1, 0) reaches corner (0, 0) only.
  const values = Array(16).fill(0);
  values[1] = 0.5;
  const out = weights(4, values, [true, true]);
  expect([out[0], out[3], out[12], out[15]]).toEqual([1, 1, 1, 1]);
});
