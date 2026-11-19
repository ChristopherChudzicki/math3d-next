import { describe, expect, test, vi } from "vitest";
import math, { mathWithTransform, typed } from "@math3d/custom-mathjs";
import MathScope from "@math3d/mathscope";
import { functionCases } from "./evaluatorCases";
import { fastCompile, isFastCompiled } from "./fastCompile";
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
  test.each(functionCases)("$title: $expr", ({ expr, point, scope, fast }) => {
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

  test.each([
    { expr: "f(x) = x + 1", built: true },
    { expr: "f(x) = x > 0 ? 1 : 2", built: false },
  ])("isFastCompiled($expr) is $built", ({ expr, built }) => {
    const f = fastCompile(math.parse(expr)).evaluate();
    expect(isFastCompiled(f)).toBe(built);
  });

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

describe("arithmetic on vectors agrees with mathjs", () => {
  // Operands the fast path takes, and ones it must leave to mathjs.
  const operands = {
    n: -2.5,
    zero: 0,
    v: [1, -2, 0.5],
    w: [4, 0, -3],
    extremes: [Infinity, NaN, -0],
    m: math.matrix([3, 0, -4]),
    // mathjs converts operands and results to a matrix's datatype.
    typed: math.matrix([3, 0, -4], "dense", "number"),
    one: [7],
    two: [1, 2],
    none: [],
    nested: [
      [1, 2],
      [3, 4],
    ],
    square: math.matrix([
      [1, 2],
      [3, 4],
    ]),
    z: [1, math.complex(0, 1), 3],
  };
  const names = Object.keys(operands);

  test.each(["+", "-", "*", "/", "^"])(
    "a %s b for each pair of operands",
    (operator) => {
      names.forEach((a) =>
        names.forEach((b) => {
          const { fast, mathjs, tookFastPath } = evaluateBoth(
            `f(x) = ${a} ${operator} ${b}`,
            operands,
          );
          expect(tookFastPath).toBe(true);
          const at = (f: unknown) => outcome(() => (f as Fn)(0));
          expect({ a, b, ...at(fast.value) }).toEqual({
            a,
            b,
            ...at(mathjs.value),
          });
        }),
      );
    },
  );

  test("a vector result is a new one at each call", () => {
    const f = fastCompile(math.parse("f(x) = v + w")).evaluate(
      new Map(Object.entries(operands)),
    ) as Fn;
    expect(f(0)).not.toBe(f(0));
  });
});

describe("which calls reach mathjs's dispatch", () => {
  const scope = {
    v: [1, -2, 0.5],
    w: [4, 0, -3],
    m: math.matrix([3, 0, -4]),
  };

  test.each<{ expr: string; dispatched: string[] }>([
    { expr: "f(x) = x^2 + sin(x) - x / 3", dispatched: [] },
    { expr: "f(x) = x v", dispatched: [] },
    { expr: "f(x) = v / x", dispatched: [] },
    { expr: "f(x) = v - w", dispatched: [] },
    { expr: "f(x) = x m + v", dispatched: [] },
    { expr: "f(x) = (x + v) - (v - x)", dispatched: [] },
    { expr: "f(x) = (v + x) - (x - v) + v x", dispatched: [] },
    { expr: "f(x) = x I", dispatched: ["multiply"] },
  ])("$expr dispatches $dispatched", ({ expr, dispatched }) => {
    const names: string[] = [];
    const f = fastCompile(math.parse(expr), {
      onDispatch: (name) => names.push(name),
    }).evaluate(new Map(Object.entries(scope))) as Fn;
    f(0.5);
    expect(names).toEqual(dispatched);
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
