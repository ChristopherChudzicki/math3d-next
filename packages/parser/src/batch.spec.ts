import { batchOf, vectorBatchOf } from "@math3d/batch-eval";
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

/** What `f`'s batched form gives: one array per component, one for a number. */
const runForm = (f: Fn, cols: number[][]): Float64Array[] | undefined => {
  const count = cols[0].length;
  const args = cols.map((column) => Float64Array.from(column));
  const vector = vectorBatchOf(f);
  if (vector) return vector.run(count, ...args);
  const result = batchOf(f)?.run(count, ...args);
  return result && [result];
};

/** Asserts `f`'s batched form gives what `f` gives at every sample. */
const expectMatches = (f: Fn, cols = columns(f.length)) => {
  const result = runForm(f, cols);
  expect(result).toBeDefined();
  const mismatches = cols[0].flatMap((_x, i) => {
    const expected = [f(...cols.map((column) => column[i]))].flat();
    expect(expected).toHaveLength(result!.length);
    return expected.flatMap((x, k) =>
      Object.is(result![k][i], x)
        ? []
        : [{ i, k, actual: result![k][i], expected: x }],
    );
  });
  expect(mismatches).toEqual([]);
};

describe("a batched form agrees with the function the app holds", () => {
  const batching = functionCases.filter((c) => c.batches);
  /** `f`'s form of the kind the case says it has. */
  const formOf = (f: Fn, batches: boolean | "vector") =>
    batches === "vector" ? vectorBatchOf(f) : batchOf(f);

  test.each(functionCases.filter((c) => !c.batches))(
    "no form for $title: $expr",
    ({ expr, scope }) => {
      const f = define(expr, scope);
      expect(batchOf(f)).toBeUndefined();
      expect(vectorBatchOf(f)).toBeUndefined();
    },
  );

  test.each(batching.filter((c) => !c.declines))(
    "$title: $expr",
    ({ expr, scope, point, batches }) => {
      const f = define(expr, scope);
      expect(formOf(f, batches)).toBeDefined();
      expectMatches(
        f,
        (point as number[]).map((x) => [x]),
      );
      expectMatches(f);
    },
  );

  test.each(batching.filter((c) => c.declines))(
    "declines where a value isn't a real number: $title: $expr",
    ({ expr, scope, point, batches }) => {
      const f = define(expr, scope);
      expect(formOf(f, batches)).toBeDefined();
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
    expect(runForm(f, [[3]])).toEqual([Float64Array.of(6)]);
  });

  test("a call with the wrong number of arguments declines, as the function throws", () => {
    const g = define("g(x) = x + 1");
    const f = define("f(x, y) = g(x, y)", { g });
    expect(() => f(1, 2)).toThrow();
    expect(batchOf(f)).toBeDefined();
    expect(runForm(f, [[1], [2]])).toBeUndefined();
  });

  test("an alias has no form, and a call to it still matches", () => {
    const f = define("f(x) = x^2 + 1");
    const g = define("g = f", { f });
    expect(batchOf(g)).toBeUndefined();
    expectMatches(define("h(x) = g(x) + 1", { g }));
  });

  test("a call to a vector function, with varying and with constant arguments", () => {
    const c = define("c(t) = [sin(t), t, 1]");
    expectMatches(define("f(u, v) = u * [cos(v), sin(v), 0] + c(u)", { c }));
    expectMatches(define("f(u, v) = c(2) + u * [v, 1, 0]", { c }));
  });

  test("a call to a vector function with the wrong number of arguments declines", () => {
    const c = define("c(t) = [t, 1, 0]");
    const f = define("f(u, v) = c(u, v) + [1, 0, 0]", { c });
    expect(() => f(1, 2)).toThrow();
    expect(runForm(f, [[1], [2]])).toBeUndefined();
  });

  test("a vector passed to a function of one number has no form", () => {
    const s = define("s(p) = 2 p");
    const f = define("f(u, v) = s([u, v, 0])", { s });
    expect(f(1, 2)).toEqual([2, 4, 0]);
    expect(batchOf(f)).toBeUndefined();
    expect(vectorBatchOf(f)).toBeUndefined();
  });

  test("a call to a vector function that has no form declines", () => {
    const g = define("g(a) = [a, norm([a, 1]), 0]");
    expect(vectorBatchOf(g)).toBeUndefined();
    const f = define("f(u) = g(u) + [1, 0, 0]", { g });
    expect(f(2)).toEqual([3, Math.sqrt(5), 0]);
    expect(vectorBatchOf(f)).toBeDefined();
    expect(runForm(f, [[2]])).toBeUndefined();
  });
});
