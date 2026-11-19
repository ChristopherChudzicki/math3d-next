import math from "@math3d/custom-mathjs";
import { describe, expect, test } from "vitest";
import { batchOf, registerBatch } from "./registry";
import { randomDoubles, SPECIAL } from "./testColumns";

type Fn = (...args: number[]) => unknown;
type ScopeEntries = Record<string, unknown>;

/** mathjs's functions don't report their parameter count as `length`. */
const paramCounts = new WeakMap<Fn, number>();

/**
 * `expr` evaluated by mathjs, with its result offered to the registry.
 * `expr` is a function assignment; its name is added to `scope`.
 */
const define = (expr: string, scope: ScopeEntries = {}): Fn => {
  const node = math.parse(expr);
  const f = node.compile().evaluate(new Map(Object.entries(scope))) as Fn;
  registerBatch(f, node, new Map(Object.entries(scope)));
  paramCounts.set(f, (node as { params?: string[] }).params?.length ?? 0);
  return f;
};

const BASE = [...SPECIAL, ...randomDoubles(60, 7)];
/** One column per parameter, each a different rotation of the same values. */
const defaultColumns = (params: number): number[][] =>
  Array.from({ length: params }, (_, k) =>
    BASE.map((_x, i) => BASE[(i + 5 * k) % BASE.length]),
  );

const runForm = (f: Fn, columns: number[][]) =>
  batchOf(f)?.run(
    columns[0].length,
    ...columns.map((column) => Float64Array.from(column)),
  );

/** Asserts `f`'s batched form gives what `f` gives, sample by sample. */
const expectMatches = (
  f: Fn,
  columns = defaultColumns(paramCounts.get(f)!),
) => {
  const result = runForm(f, columns);
  expect(result).toBeInstanceOf(Float64Array);
  const mismatches = columns[0].flatMap((_x, i) => {
    const expected = f(...columns.map((column) => column[i]));
    return Object.is(result![i], expected)
      ? []
      : [{ i, actual: result![i], expected }];
  });
  expect(mismatches).toEqual([]);
};

const POSITIVE = [BASE.filter((x) => x > 0)];

describe("a function of numbers matches mathjs", () => {
  test.each<{ expr: string; scope?: ScopeEntries; columns?: number[][] }>([
    { expr: "f(x, y) = x + y" },
    { expr: "f(x, y) = x - y" },
    { expr: "f(x, y) = x * y" },
    { expr: "f(x, y) = x / y" },
    { expr: "f(x) = -x + (+x)" },
    { expr: "f(x) = x^2 + x^(-3) + x^0" },
    { expr: "f(x) = x^0.5", columns: POSITIVE },
    { expr: "f(x) = a x + pi", scope: { a: 2.5 } },
    { expr: "f(x) = sin(x) + exp(x)" },
    { expr: "f(x, y, z) = max(x, y, z)" },
    { expr: "f(x, y, z) = add(x, y, z)" },
    {
      expr: "f(x, y) = add(x, y)",
      scope: { add: (a: number, b: number) => a * b + 100 },
    },
    // An operator's function never comes from the scope.
    { expr: "f(x) = x + 1", scope: { add: () => 0 } },
    { expr: "f(x) = sin(x)", scope: { sin: (x: number) => 10 * x } },
    { expr: "f(x) = h(x)", scope: { h: (x: number) => x + 1 } },
  ])("$expr", ({ expr, scope, columns }) => {
    expectMatches(define(expr, scope), columns);
  });

  test("a scope function named as mathjs's replaces it", () => {
    const f = define("f(x, y) = add(x, y)", {
      add: (a: number, b: number) => a * b + 100,
    });
    expect(runForm(f, [[1], [2]])).toEqual(Float64Array.of(102));
  });

  test("a constant value fills the result", () => {
    const f = define("f(x) = 3");
    expect(runForm(f, [[1, 2, 5]])).toEqual(Float64Array.of(3, 3, 3));
  });

  test("a parameter alone gives a copy of its column", () => {
    const xs = Float64Array.of(1, 2, 5);
    const result = batchOf(define("f(x) = x"))?.run(3, xs);
    expect(result).toEqual(xs);
    expect(result).not.toBe(xs);
  });

  test("a user function with a form, called twice", () => {
    const g = define("g(x) = x^2 + 1");
    expectMatches(define("f(x) = g(x) + g(2 x)", { g }));
  });

  test("a user function with a form, called with a constant", () => {
    const g = define("g(a, b) = a - b");
    expectMatches(define("f(x) = g(2, x)", { g }));
  });
});

describe("no batched form", () => {
  test.each<{ expr: string; scope?: ScopeEntries }>([
    { expr: "f(x) = [x, 1]" },
    { expr: "f(x) = x i" },
    { expr: "f(x) = x + v", scope: { v: [1, 0, 0] } },
    { expr: "f(x) = x + a(x)", scope: { a: 2.5 } },
    { expr: "f(x) = x > 0 ? 1 : 2" },
    { expr: "f(sin, x) = sin(x)" },
    { expr: "f(a, b, c, d, e, g) = a + b" },
    { expr: "f(x) = x + undefinedName" },
    { expr: "f(toString) = toString + 1" },
    { expr: "f(x) = f(x) + 1", scope: { f: () => 5 } },
    { expr: "f(x) = x + sqrt(-4)" },
  ])("$expr", ({ expr, scope }) => {
    expect(batchOf(define(expr, scope))).toBeUndefined();
  });

  test("a node that isn't a function assignment", () => {
    const f = () => 2;
    registerBatch(f, math.parse("a = 2"), new Map());
    expect(batchOf(f)).toBeUndefined();
  });
});

describe("run", () => {
  test("declines when a sample isn't a number, and recovers", () => {
    const f = define("f(x) = sqrt(x)");
    expect(runForm(f, [[4, -1]])).toBeUndefined();
    expect(runForm(f, [[4, 9]])).toEqual(Float64Array.of(2, 3));
  });

  test("declines when a function throws", () => {
    const f = define("f(x) = boom(x)", {
      boom: () => {
        throw new Error("no");
      },
    });
    expect(batchOf(f)).toBeDefined();
    expect(runForm(f, [[1, 2]])).toBeUndefined();
  });

  test("two forms keep their own results", () => {
    const f = define("f(x) = x + 1");
    const g = define("g(x) = x * 10");
    const fromF = runForm(f, [[1, 2]]);
    const fromG = runForm(g, [[1, 2]]);
    expect(fromF).toEqual(Float64Array.of(2, 3));
    expect(fromG).toEqual(Float64Array.of(10, 20));
  });
});
