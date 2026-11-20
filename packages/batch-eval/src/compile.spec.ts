import math from "@math3d/custom-mathjs";
import { describe, expect, test } from "vitest";
import { MATH_KERNELS } from "./kernels";
import { batchOf, registerBatch } from "./registry";
import { randomDoubles, SPECIAL } from "./testColumns";
import { define, mismatches, runForm } from "./testForms";
import type { Fn } from "./testForms";

type ScopeEntries = Record<string, unknown>;

const BASE = [...SPECIAL, ...randomDoubles(60, 7)];
/** One column per parameter, each a different rotation of the same values. */
const defaultColumns = (params: number): number[][] =>
  Array.from({ length: params }, (_, k) =>
    BASE.map((_x, i) => BASE[(i + 5 * k) % BASE.length]),
  );

const expectMatches = (f: Fn, columns = defaultColumns(batchOf(f)!.params)) =>
  expect(mismatches(f, columns)).toEqual([]);

const POSITIVE = [BASE.filter((x) => x > 0)];

describe("a function of numbers matches mathjs", () => {
  test.each<{ expr: string; scope?: ScopeEntries; columns?: number[][] }>([
    { expr: "f(x) = -x + (+x)" },
    { expr: "f(x) = x^2 + x^(-3) + x^0" },
    { expr: "f(x) = x^0.5", columns: POSITIVE },
    { expr: "f(x) = sqrt(x) + log(x)", columns: POSITIVE },
    ...Object.keys(MATH_KERNELS).map((name) => ({
      expr: `f(x) = ${name}(x)`,
    })),
    { expr: "f(x, y) = max(x, 1, y)" },
    { expr: "f(x, y, z) = add(x, y, z)" },
    {
      expr: "f(x, y) = add(x, y)",
      scope: { add: (a: number, b: number) => a * b + 100 },
    },
  ])("$expr", ({ expr, scope, columns }) => {
    expectMatches(define(expr, scope), columns);
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
  test("a constant call that isn't a number", () => {
    expect(batchOf(define("f(x) = x + sqrt(-4)"))).toBeUndefined();
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
