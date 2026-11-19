import { batchOf } from "@math3d/batch-eval";
import math from "@math3d/custom-mathjs";
import { describe, expect, test } from "vitest";
import { getValidatedEvaluate } from "./evaluate";
import { functionCases } from "./evaluatorCases";
import type { ParseValidate } from "./interfaces";

type Fn = (...args: number[]) => unknown;

/** What MathScope holds for `expr`: evaluated as the app evaluates it. */
const define = (
  expr: string,
  scope: Record<string, unknown> | Map<string, unknown> = {},
  validate?: ParseValidate,
) =>
  getValidatedEvaluate(
    math.parse(expr),
    validate,
  )(scope instanceof Map ? scope : new Map(Object.entries(scope))) as Fn;

// No NaN: mathjs's fractional power of NaN is complex, so a column holding
// one declines.
const VALUES = [
  ...[0, -0, 1, -1, 0.5, -2.5, 1e300, 1e-300, Infinity, -Infinity],
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

/** Asserts `f`'s batched form gives what `f` gives at every sample. */
const expectMatches = (f: Fn, cols = columns(f.length)) => {
  const result = runForm(f, cols);
  expect(result).toBeInstanceOf(Float64Array);
  const mismatches = cols[0].flatMap((_x, i) => {
    const expected = f(...cols.map((column) => column[i]));
    return Object.is(result![i], expected)
      ? []
      : [{ i, actual: result![i], expected }];
  });
  expect(mismatches).toEqual([]);
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
      expectMatches(f);
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

  test("the function a validator returns carries the form", () => {
    // As `realFunc` does: a new function that passes numbers through.
    const validate: ParseValidate = (evaluated) => {
      const inner = evaluated as Fn;
      const wrapped = (...args: number[]) => inner(...args);
      return Object.defineProperty(wrapped, "length", { value: inner.length });
    };
    expectMatches(define("f(x, y, z) = x^2 + y z - 4", {}, validate));
  });

  test("a scope value is the one at evaluation", () => {
    const scope = new Map<string, unknown>([["a", 2]]);
    const f = define("f(x) = a x", scope);
    scope.set("a", 100);
    expect(runForm(f, [[3]])).toEqual(Float64Array.of(6));
  });

  test("a call with the wrong number of arguments declines, as the function throws", () => {
    const g = define("g(x) = x + 1");
    const f = define("f(x, y) = g(x, y)", { g });
    expect(() => f(1, 2)).toThrow("needs 1 input");
    expect(batchOf(f)).toBeDefined();
    expect(runForm(f, [[1], [2]])).toBeUndefined();
  });

  test("an alias has no form, and a call to it still matches", () => {
    const f = define("f(x) = x^2 + 1");
    const g = define("g = f", { f });
    expect(batchOf(g)).toBeUndefined();
    expectMatches(define("h(x) = g(x) + 1", { g }));
  });
});
