import { expect, test } from "vitest";
import { writeMappedValues } from "./mappedValue";

/** Each vertex's [value, weight] for values given row by row. */
const written = (cols: number, values: number[]) => {
  const out = new Float32Array(2 * values.length);
  writeMappedValues(values, cols, values.length / cols, out);
  return Array.from({ length: values.length }, (_, k) => [
    out[2 * k],
    out[2 * k + 1],
  ]);
};

const weights = (cols: number, values: number[]) =>
  written(cols, values).map(([, weight]) => weight);

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
  weights(2, [0, 0.25, 0, 0.25]).forEach((weight) =>
    expect(weight).toBeCloseTo(0.5),
  );
});

test("the diagonal each cell is split along counts as an edge", () => {
  // Grid edges change by 0.175; the diagonal from (1, 0) to (0, 1) by 0.35.
  expect(weights(2, [0.175, 0, 0.35, 0.175])).toEqual([0, 1, 1, 0]);
});

test("values compare after clamping to [0, 1]", () => {
  expect(written(2, [1.2, 50, 1, 7])).toEqual(Array(4).fill([1, 0]));
});

test.each([NaN, Infinity])(
  "a value of %s blends itself and every vertex sharing an edge with it, and sends 0",
  (missing) => {
    const out = written(3, [0.5, 0.5, 0.5, 0.5, missing, 0.5, 0.5, 0.5, 0.5]);
    expect(out[4]).toEqual([0, 1]);
    // Corners (0, 0) and (2, 2) are off the center's edges and diagonals.
    expect(out.map(([, weight]) => weight)).toEqual([
      0, 1, 1, 1, 1, 1, 1, 1, 0,
    ]);
  },
);
