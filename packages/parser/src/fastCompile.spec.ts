import { describe, expect, test, vi } from "vitest";
import math, { mathWithTransform, typed } from "@math3d/custom-mathjs";
import MathScope from "@math3d/mathscope";
import { fastCompile } from "./fastCompile";
import { latexParser } from "./parsers";

type Fn = (...args: unknown[]) => unknown;

/** What running `f` gives: its value, or the message of what it throws. */
const outcome = (f: () => unknown) => {
  try {
    return { value: f() };
  } catch (err) {
    return { error: (err as Error).message };
  }
};

/**
 * `expr` evaluated by fastCompile and by mathjs, and whether fastCompile did
 * so without handing the expression to mathjs.
 */
const evaluateBoth = (expr: string, scope: Record<string, unknown> = {}) => {
  const node = math.parse(expr);
  const compiled = node.compile();
  const mathjsEvaluate = vi.spyOn(compiled, "evaluate");
  vi.spyOn(node, "compile").mockReturnValue(compiled);
  const fast = outcome(() =>
    fastCompile(node).evaluate(new Map(Object.entries(scope))),
  );
  return {
    fast,
    tookFastPath: mathjsEvaluate.mock.calls.length === 0,
    mathjs: outcome(() =>
      math
        .parse(expr)
        .compile()
        .evaluate(new Map(Object.entries(scope))),
    ),
  };
};

/**
 * Asserts `expr` defines a function that agrees with mathjs at each of
 * `points`. Returns whether fastCompile built it without mathjs.
 */
const expectSameFunction = (
  expr: string,
  points: unknown[][],
  scope: Record<string, unknown> = {},
) => {
  const { fast, mathjs, tookFastPath } = evaluateBoth(expr, scope);
  expect(fast.value).toBeInstanceOf(Function);
  // A function result, as `diff(x)` gives, is a new one on every call.
  const at = (f: unknown, point: unknown[]) =>
    outcome(() => {
      const value = (f as Fn)(...point);
      return typeof value === "function" ? "a function" : value;
    });
  points.forEach((point) => {
    expect(at(fast.value, point)).toEqual(at(mathjs.value, point));
  });
  return tookFastPath;
};

describe("fastCompile agrees with mathjs", () => {
  test.each<{
    title: string;
    expr: string;
    point: unknown[];
    scope?: Record<string, unknown>;
    fast: boolean;
  }>([
    {
      title: "arithmetic",
      expr: "f(x, y, z) = x^2 + y z - x / y + (-z)",
      point: [1, 2, 3],
      fast: true,
    },
    {
      title: "whole-number exponents",
      expr: "f(x) = x^2 + x^(-3) + (x i)^2",
      point: [-1.5],
      fast: true,
    },
    {
      title: "a fractional exponent of a negative number",
      expr: "f(x) = x^0.5",
      point: [-4],
      fast: true,
    },
    {
      title: "the real root the parser asks for",
      expr: "f(x) = $realPowOdd(x, 1/3)",
      point: [-8],
      fast: true,
    },
    {
      title: "a scope value and a constant",
      expr: "f(x) = a x + pi",
      point: [0.5],
      scope: { a: 2.5 },
      fast: true,
    },
    {
      title: "values that aren't numbers",
      expr: "f(x) = x i + [1, 2, 3] x + v",
      point: [0.5],
      scope: { v: [1, 0, 0] },
      fast: true,
    },
    {
      title: "a call with three arguments",
      expr: "f(x) = max(x, 1, 2) + norm([x, 1])",
      point: [-8],
      fast: true,
    },
    {
      title: "a scope function named as mathjs's",
      expr: "f(x) = sin(x)",
      point: [0.5],
      scope: { sin: (x: number) => 10 * x },
      fast: true,
    },
    {
      title: "a scope value named as an operator's function",
      expr: "f(x) = x + 1",
      point: [0.5],
      scope: { add: () => 0 },
      fast: true,
    },
    {
      title: "a parameter named as a scope value",
      expr: "f(x) = x + 1",
      point: [0.5],
      scope: { x: 100 },
      fast: true,
    },
    {
      title: "a scope value called though it is no function",
      expr: "f(x) = x + a(x)",
      point: [0.5],
      scope: { a: 2.5 },
      fast: false,
    },
    {
      title: "a node type it doesn't handle",
      expr: "f(x) = x > 0 ? 1 : 2",
      point: [1],
      fast: false,
    },
    {
      title: "a parameter called as a function",
      expr: "f(sin, x) = sin(x)",
      point: [Math.cos, 0],
      fast: false,
    },
    {
      title: "more parameters than a closure has slots",
      expr: "f(a, b, c, d, e, g) = a + b + c + d + e + g",
      point: [1, 2, 3, 4, 5, 6],
      fast: false,
    },
    {
      title: "an undefined name",
      expr: "f(x) = x + undefinedName",
      point: [1],
      fast: false,
    },
    {
      title: "a parameter named as an Object.prototype property",
      expr: "f(toString) = toString + 1",
      point: [1],
      fast: false,
    },
    {
      // The scope's `f` is an earlier definition, not the one being defined.
      title: "a function that calls itself",
      expr: "f(x) = f(x) + 1",
      point: [1],
      scope: { f: () => 5 },
      fast: false,
    },
  ])("$title: $expr", ({ expr, point, scope, fast }) => {
    expect(expectSameFunction(expr, [point], scope)).toBe(fast);
  });

  test.each([{ expr: "2 + 3 a" }, { expr: "b = [1, 2] a" }])(
    "the value $expr",
    ({ expr }) => {
      const { fast, mathjs, tookFastPath } = evaluateBoth(expr, { a: 2.5 });
      expect(fast).toEqual(mathjs);
      expect(tookFastPath).toBe(true);
    },
  );

  test("an expression mathjs won't compile", () => {
    const node = math.parse("5!");
    expect(outcome(() => fastCompile(node))).toEqual({
      error: 'Function factorial missing in provided namespace "math"',
    });
  });

  test("every function called with numbers", () => {
    // Names like `not` parse as operators, so `not(x)` is no function call.
    const isCallable = (name: string) => {
      try {
        return math.isFunctionNode(math.parse(`${name}(x)`));
      } catch {
        return false;
      }
    };
    const names = Object.keys(mathWithTransform).filter(
      (name) =>
        typeof mathWithTransform[name] === "function" && isCallable(name),
    );
    expect(names).toContain("pow");
    names.forEach((name) => {
      expectSameFunction(`f(x) = ${name}(x)`, [[-2.5], [0], [0.5], [3]]);
      expectSameFunction(`f(x, y) = ${name}(x, y)`, [
        [-2.5, 0.5],
        [0, 0],
        [3, -2],
        [-8, 1 / 3],
      ]);
    });
  });
});

// fastCompile skips dispatch by calling these. Without them every call still
// agrees with mathjs and is only slower.
test("typed-function gives the implementation a call with numbers runs", () => {
  const implementation = (name: string, args: number[]) =>
    typed.resolve(mathWithTransform[name], args)?.implementation;
  expect(implementation("sin", [0])).toBeInstanceOf(Function);
  expect(implementation("add", [0, 0])).toBeInstanceOf(Function);
});

describe("what a function reads once per evaluation", () => {
  test("a scope value is the one at evaluation", () => {
    const scope = new Map<string, unknown>([["a", 2]]);
    const f = fastCompile(math.parse("f(x) = a x")).evaluate(scope) as Fn;
    scope.set("a", 100);
    expect(f(3)).toBe(6);
  });

  test("MathScope gives a function its dependency's new value", () => {
    const scope = new MathScope({ parse: latexParser.parse });
    scope.setExpressions([
      { id: "a", parseable: "a = 2" },
      { id: "f", parseable: "f(x) = a x" },
    ]);
    scope.setExpressions([{ id: "a", parseable: "a = 100" }]);
    expect((scope.results.get("f") as Fn)(3)).toBe(300);
  });

  test("a number-valued subexpression without parameters is computed once", () => {
    const g = vi.fn((a: number) => a + 1);
    const scope = new Map<string, unknown>([
      ["a", 2],
      ["g", g],
    ]);
    const f = fastCompile(math.parse("f(x) = x g(a)^2")).evaluate(scope) as Fn;
    expect([f(1), f(2)]).toEqual([9, 18]);
    expect(g).toHaveBeenCalledTimes(1);
  });

  test("a subexpression that isn't a number is computed per call", () => {
    const scope = new Map<string, unknown>([["v", [1, 2]]]);
    const f = fastCompile(math.parse("f(x) = 2 v")).evaluate(scope) as Fn;
    (f(0) as number[])[0] = 99;
    expect(f(0)).toEqual([2, 4]);
  });

  test("a subexpression that throws does so at the call", () => {
    const scope = new Map<string, unknown>([
      [
        "g",
        () => {
          throw new Error("no value");
        },
      ],
    ]);
    const f = fastCompile(math.parse("f(x) = x + g(1)")).evaluate(scope) as Fn;
    expect(() => f(1)).toThrow("no value");
  });
});
