import { describe, expect, test, vi } from "vitest";
import math from "@math3d/custom-mathjs";
import MathScope from "@math3d/mathscope";
import { fastCompile, numberImplementation } from "./fastCompile";
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

const evaluateBoth = (expr: string, scope: Record<string, unknown> = {}) => {
  const node = math.parse(expr);
  return {
    fast: outcome(() =>
      fastCompile(node).evaluate(new Map(Object.entries(scope))),
    ),
    mathjs: outcome(() =>
      node.compile().evaluate(new Map(Object.entries(scope))),
    ),
  };
};

/** Asserts `expr` defines a function that agrees with mathjs at each of `points`. */
const expectSameFunction = (
  expr: string,
  points: unknown[][],
  scope: Record<string, unknown> = {},
) => {
  const { fast, mathjs } = evaluateBoth(expr, scope);
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
};

describe("fastCompile agrees with mathjs", () => {
  test.each([
    { expr: "f(x, y, z) = x^2 + y z - x / y + (-z)", points: [[1, 2, 3]] },
    { expr: "f(x) = a x + pi", scope: { a: 2.5 } },
    { expr: "f(x) = x i + [1, 2, 3] x + v", scope: { v: [1, 0, 0] } },
    { expr: "f(x) = max(x, 1, 2) + norm([x, 1])" },
    { expr: "f(x) = sin(x)", scope: { sin: (x: number) => 10 * x } },
    { expr: "f(x) = x + 1", scope: { add: () => 0 } },
    { expr: "f(x) = x + 1", scope: { x: 100 } },
    { expr: "f(x) = x + a(x)", scope: { a: 2.5 } },
  ])("$expr with $scope", ({ expr, scope, points }) => {
    expectSameFunction(expr, points ?? [[-8], [0.5]], scope);
  });

  test.each([
    { expr: "f(x) = x > 0 ? 1 : 2", point: [1] },
    { expr: "f(sin, x) = sin(x)", point: [Math.cos, 0] },
    { expr: "f(a, b, c, d, e, g) = a + b + c + d + e + g" },
    { expr: "f(x) = x + undefinedName", point: [1] },
    { expr: "f(toString) = toString + 1", point: [1] },
    // The scope's `f` is an earlier definition, not the one being defined.
    { expr: "f(x) = f(x) + 1", point: [1], scope: { f: () => 5 } },
  ])("$expr, which it leaves to mathjs", ({ expr, point, scope }) => {
    expectSameFunction(expr, [point ?? [1, 2, 3, 4, 5, 6]], scope);
  });

  test.each([
    { expr: "2 + 3 a", scope: { a: 2.5 } },
    { expr: "b = [1, 2] a", scope: { a: 2.5 } },
  ])("the value $expr", ({ expr, scope }) => {
    const { fast, mathjs } = evaluateBoth(expr, scope);
    expect(fast).toEqual(mathjs);
  });

  test("an expression mathjs won't compile", () => {
    const node = math.parse("5!");
    expect(outcome(() => fastCompile(node))).toEqual(
      outcome(() => node.compile()),
    );
    expect(() => fastCompile(node)).toThrow("factorial");
  });

  test("every function called with numbers", () => {
    const { mathWithTransform } = math.expression as unknown as {
      mathWithTransform: Record<string, unknown>;
    };
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

// Without one, every call still agrees with mathjs and is only slower.
test("mathjs functions have a number implementation to skip dispatch to", () => {
  expect(numberImplementation(math.sin, 1)).toBeInstanceOf(Function);
  expect(numberImplementation(math.add, 2)).toBeInstanceOf(Function);
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

  test("a subexpression without parameters is computed once", () => {
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
