import { batchOf } from "@math3d/batch-eval";
import math from "@math3d/custom-mathjs";
import { validators } from "@math3d/validators";
import { describe, expect, test } from "vitest";
import { getValidatedEvaluate } from "./evaluate";
import { functionCases } from "./evaluatorCases";
import type { ParseValidate } from "./interfaces";

type Fn = (...args: number[]) => unknown;

/** What MathScope holds for `expr`: evaluated as the app evaluates it. */
const define = (
  expr: string,
  scope: Record<string, unknown> = {},
  validate?: ParseValidate,
) =>
  getValidatedEvaluate(
    math.parse(expr),
    validate,
  )(new Map(Object.entries(scope))) as Fn;

const VALUES = [
  ...[0, -0, 1, -1, 0.5, -2.5, 1e300, 1e-300, NaN, Infinity, -Infinity],
  ...Array.from({ length: 40 }, (_, i) => Math.sin(i + 1) * 10 ** (i % 5)),
];
/** One column per parameter, each a different rotation of the same values. */
const columns = (params: number): number[][] =>
  Array.from({ length: params }, (_, k) =>
    VALUES.map((_x, i) => VALUES[(i + 5 * k) % VALUES.length]),
  );

const runForm = (f: Fn, cols: number[][]) =>
  batchOf(f)?.run(
    cols[0].length,
    ...cols.map((column) => Float64Array.from(column)),
  );

/** Where `result` differs from what `f` gives, sample by sample. */
const mismatches = (f: Fn, cols: number[][], result: Float64Array) =>
  cols[0].flatMap((_x, i) => {
    const expected = f(...cols.map((column) => column[i]));
    return Object.is(result[i], expected)
      ? []
      : [{ i, actual: result[i], expected }];
  });

/** Asserts `f`'s batched form gives what `f` gives at every sample. */
const expectMatches = (f: Fn, cols = columns(f.length)) => {
  const result = runForm(f, cols);
  expect(result).toBeInstanceOf(Float64Array);
  expect(mismatches(f, cols, result!)).toEqual([]);
};

describe("a batched form agrees with the function the app holds", () => {
  const batching = functionCases.filter((c) => c.batches);

  test.each(functionCases.filter((c) => !c.batches))(
    "no form for $title: $expr",
    ({ expr, scope }) => {
      expect(batchOf(define(expr, scope))).toBeUndefined();
    },
  );

  test.each(batching.filter((c) => !c.declines))(
    "$title: $expr",
    ({ expr, scope, point }) => {
      const f = define(expr, scope);
      expectMatches(
        f,
        (point as number[]).map((x) => [x]),
      );
      // mathjs gives a complex NaN for some of these, so a run may decline.
      const cols = columns(f.length);
      const result = runForm(f, cols);
      if (result) expect(mismatches(f, cols, result)).toEqual([]);
    },
  );

  test.each(batching.filter((c) => c.declines))(
    "declines where the value isn't a number: $title: $expr",
    ({ expr, scope, point }) => {
      const f = define(expr, scope);
      expect(batchOf(f)).toBeDefined();
      expect(
        runForm(
          f,
          (point as number[]).map((x) => [x]),
        ),
      ).toBeUndefined();
    },
  );

  test("a validated function carries the form", () => {
    const f = define(
      "f(x, y, z) = x^2 + y z - 4",
      {},
      validators.realFunc[3][1] as ParseValidate,
    );
    expectMatches(f);
  });

  test("a user function called twice", () => {
    const g = define("g(x) = x^2 + 1");
    expectMatches(define("f(x) = g(x) + g(2 x)", { g }));
  });

  test("an alias has no form, and a call to it still matches", () => {
    const f = define("f(x) = x^2 + 1");
    const g = define("g = f", { f });
    expect(batchOf(g)).toBeUndefined();
    expectMatches(define("h(x) = g(x) + 1", { g }));
  });
});
