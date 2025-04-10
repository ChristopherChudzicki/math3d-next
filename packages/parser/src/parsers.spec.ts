import { describe, test, expect, it } from "vitest";
import invariant from "tiny-invariant";
import { Parseable } from "./interfaces";
import { DetailedAssignmentError } from "./MathJsParser";
import { latexParser as parser } from "./parsers";
import { ParameterErrors } from "./rules";

describe("preprocesser fraction conversion", () => {
  test("converts zero fractions correctly", () => {
    const input = "a + b";
    const expected = "a + b";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("converts a single fraction correctly", () => {
    const input = "1 + \\frac{1 + \\cos{x}}{1 - \\cos{x}}";
    const expected = "1 + divide(1 + cos(x), 1 - cos(x))";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("converts multiple fractions correctly", () => {
    const input = "x + \\frac{a + \\frac{b + c}{d - e}}{f + g}";
    const expected = "x + divide(a + divide(b + c, d - e), f + g)";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("Converts numeric fractions without braces", () => {
    const input = "x + \\frac123 \\frac456 \\fracabc";
    const expected = "x + divide(1, 2)3 divide(4, 5)6 fracabc";
    expect(parser.preprocess(input)).toBe(expected);
  });
});

test("Unbracketed exponent conversion", () => {
  const input = "1 + 2^34 + 5^ab";
  const expected = "1 + 2^(3)4 + 5^(a)b";
  expect(parser.preprocess(input)).toBe(expected);
});

test("brackect conversion", () => {
  const input = String.raw`1 + \left\lbrack\left\lbrack1,2\right\rbrack,\left\lbrack3,4\right\rbrack\right\rbrack`;
  const expected = "1 + [[1,2],[3,4]]";
  expect(parser.preprocess(input)).toBe(expected);
});

describe("subscript conversion", () => {
  test("does nothing to single character subscripts", () => {
    const input = "x_1 + x_2";
    const expected = "x_1 + x_2";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("converts multi-character subscripts", () => {
    const input = "x_{12foo} + y_{bar123}";
    const expected = "x_12foo + y_bar123";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("converts nested subscripts", () => {
    const input = "x_{12foo_{bar123_{evenlower}}}";
    const expected = "x_12foo_bar123_evenlower";
    expect(parser.preprocess(input)).toBe(expected);
  });
});

describe("operatorname conversion", () => {
  test("operatorname and mathrm are removed", () => {
    const input =
      "1 + \\operatorname{sin}(1+\\operatorname{\\mathrm{woof}}(x)) + y";
    const expected = "1 + sin(1+woof(x)) + y";
    expect(parser.preprocess(input)).toBe(expected);
  });
});

describe("backslash removal", () => {
  test("backslashes are removed", () => {
    const input = "1 + 3\\sin{\\pi x}";
    const expected = "1 + 3 sin( pi x)";
    expect(parser.preprocess(input)).toBe(expected);
  });
});

describe("Parsing assignments and function assignments", () => {
  const getParseError = (
    parseable: Parseable,
    Err = DetailedAssignmentError,
  ) => {
    try {
      parser.parse(parseable);
    } catch (err) {
      if (!(err instanceof Err)) {
        throw new Error(`Expected an instanceof ${Err.name}`);
      }
      return err;
    }
    throw new Error("Expected parser.parse to throw.");
  };

  const assertErrorMatches = (err?: Error, matcher?: RegExp) => {
    if (matcher instanceof RegExp) {
      expect(err).toBeInstanceOf(Error);
      invariant(err);
      expect(err.message).toMatch(matcher);
    } else {
      expect(err).toBeUndefined();
    }
  };

  it("parses { lhs, rhs } variable assignments", () => {
    const node = parser.parse({
      lhs: "a",
      rhs: "1 + 2",
      type: "assignment",
    });
    const evaluated = node.evaluate();
    expect(evaluated).toBe(3);
  });

  it("parses { lhs, rhs } function assignments", () => {
    const node = parser.parse({
      lhs: "f(x, y,z)",
      rhs: "x*y*z",
      type: "assignment",
    });
    const evaluated = node.evaluate();
    invariant(typeof evaluated === "function");
    expect(evaluated(2, 3, 4)).toBe(24);
    expect(evaluated.length).toBe(3);
  });

  it("Parsing { name, params, rhs } function assignments", () => {
    const node = parser.parse({
      name: "f",
      params: ["x", "y", "z"],
      rhs: "x * y * z",
      type: "function-assignment",
    });
    const evaluated = node.evaluate();
    invariant(typeof evaluated === "function");

    expect(evaluated(2, 3, 4)).toBe(24);
    expect(evaluated.length).toBe(3);
  });

  it.each([
    {
      lhs: "f(x+)",
      rhs: "1",
      expected: {
        lhsErr: /Some parameter names are invalid/,
        rhsErr: undefined,
      },
    },
    {
      lhs: "f(x+)",
      rhs: "1+",
      expected: {
        lhsErr: /Some parameter names are in/,
        rhsErr: /Unexpected end of expression/,
      },
    },
    {
      lhs: "f(x)",
      rhs: "1+",
      expected: {
        lhsErr: undefined,
        rhsErr: /Unexpected end of expression/,
      },
    },
    {
      lhs: "f+(x)",
      rhs: "1",
      expected: {
        lhsErr: /Invalid left-hand side./,
        rhsErr: undefined,
      },
    },
    {
      lhs: "f(x,x,y)",
      rhs: "1",
      expected: {
        lhsErr: /Parameter names must be unique/,
        rhsErr: undefined,
      },
    },
    {
      /**
       * Duplicate parameter detection should be whitespace-insensitive
       */
      lhs: "f(x,x ,y)",
      rhs: "1",
      expected: {
        lhsErr: /Parameter names must be unique/,
        rhsErr: undefined,
      },
    },
    {
      lhs: "x!",
      rhs: "1",
      expected: {
        lhsErr: /Invalid left-hand side/,
        rhsErr: undefined,
      },
    },
  ])(
    "Associates parse asiggnment { lhs, rhs } errors with lhs or rhs",
    ({ lhs, rhs, expected }) => {
      const err = getParseError({ lhs, rhs, type: "assignment" });
      assertErrorMatches(err.lhs, expected.lhsErr);
      assertErrorMatches(err.rhs, expected.rhsErr);
    },
  );

  it.each([
    {
      name: "f",
      params: ["x+"],
      rhs: "1",
      expected: {
        lhsErr: /Some parameter names are invalid/,
        rhsErr: undefined,
      },
    },
    {
      name: "f",
      params: ["x+"],
      rhs: "1+",
      expected: {
        lhsErr: /Some parameter names are in/,
        rhsErr: /Unexpected end of expression/,
      },
    },
    {
      name: "f",
      params: ["x"],
      rhs: "1+",
      expected: {
        lhsErr: undefined,
        rhsErr: /Unexpected end of expression/,
      },
    },
    {
      name: "f+",
      params: ["x"],
      rhs: "1",
      expected: {
        lhsErr: /Invalid left-hand side./,
        rhsErr: undefined,
      },
    },
    {
      name: "f",
      params: ["x", "x", "y"],
      rhs: "1",
      expected: {
        lhsErr: /Parameter names must be unique/,
        rhsErr: undefined,
      },
    },
  ])(
    "Associates parse function asiggnment { name, params, rhs } errors with lhs or rhs",
    ({ name, params, rhs, expected }) => {
      const err = getParseError({
        name,
        params,
        rhs,
        type: "function-assignment",
      });
      assertErrorMatches(err.lhs, expected.lhsErr);
      assertErrorMatches(err.rhs, expected.rhsErr);
    },
  );

  it("Associates bad parameters with their indexes", () => {
    const err = getParseError({
      lhs: "f(x,y,w+,z,z)",
      rhs: "1",
      type: "assignment",
    });
    invariant(err instanceof DetailedAssignmentError);
    invariant(err.lhs instanceof ParameterErrors);

    expect(Object.keys(err.lhs.paramErrors)).toEqual(["2", "3", "4"]);
    assertErrorMatches(
      err.lhs.paramErrors[2],
      /"w\+" is not a valid parameter name/,
    );
    assertErrorMatches(
      err.lhs.paramErrors[3],
      /Parameter names must be unique./,
    );
    assertErrorMatches(
      err.lhs.paramErrors[4],
      /Parameter names must be unique./,
    );
  });
});

describe("Parsing arrays", () => {
  it("returns an array", () => {
    const node = parser.parse({
      type: "array",
      items: ["1", "2", "3"],
    });
    expect(node.evaluate()).toEqual([1, 2, 3]);
  });

  it("parses arrays", () => {
    const node = parser.parse({
      type: "array",
      items: [
        "1+2",
        "f(x) = x^2",
        {
          type: "expr",
          expr: "[1,2,3]",
        },
        {
          type: "assignment",
          lhs: "g(x)",
          rhs: "x^3",
        },
      ],
    });
    const evaluated = node.evaluate() as unknown[];
    expect(evaluated[0]).toBe(3);
    expect(evaluated[2]).toEqual([1, 2, 3]);
    const f = evaluated[1] as (x: number) => number;
    const g = evaluated[3] as (x: number) => number;
    expect(f(2)).toBe(4);
    expect(g(3)).toBe(27);
  });

  it("Can validate and transform the overall array result", () => {
    const validate = ([a, b]: unknown[]) => {
      invariant(typeof a === "number" && typeof b === "number");
      if (a > b) {
        throw new Error("Shucks!");
      }
      return [a ** 2, b ** 2];
    };
    const node = parser.parse({ type: "array", items: ["1", "2"], validate });
    expect(node.evaluate()).toEqual([1, 4]);

    const shouldThrow = () =>
      parser.parse({ type: "array", items: ["2", "1"], validate }).evaluate();
    expect(shouldThrow).toThrowError("Shucks!");
  });

  it("Records dependencies of all items", () => {
    const node = parser.parse({
      type: "array",
      items: ["a+b", "b+c", "c+d"],
    });
    expect(node.dependencies).toEqual(new Set(["a", "b", "c", "d"]));
  });

  const getError = (cb: () => void) => {
    try {
      cb();
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new Error("Expected an error.");
      }
      return e;
    }
    throw new Error("Expected parser.parse to throw.");
  };

  it("Records parsing errors for individual items", () => {
    const error = getError(() =>
      parser.parse({
        type: "array",
        items: ["a", "b+", "c", "d+", "e"],
      }),
    );

    invariant(error instanceof AggregateError);
    expect(
      Object.values(error.errors).filter((e) => e !== undefined),
    ).toHaveLength(2);
    expect(error.errors[1].message).toMatch(/Unexpected end of expression/);
    expect(error.errors[3].message).toMatch(/Unexpected end of expression/);
  });

  it("Records eval errors for individual items", () => {
    const error = getError(() =>
      parser
        .parse({
          type: "array",
          items: ["1", "2", "x", "4", "y"],
        })
        .evaluate(),
    );
    invariant(error instanceof AggregateError);
    expect(
      Object.values(error.errors).filter((e) => e !== undefined),
    ).toHaveLength(2);
    expect(error.errors[2].message).toMatch(/Undefined symbol x/);
    expect(error.errors[4].message).toMatch(/Undefined symbol y/);
  });
});

describe("returned node's MathNode.evaluate", () => {
  const { parse } = parser;

  it("includes arity (f.length) on results that are functions", () => {
    const f = parse("f(x, y, z) = x + y + z").evaluate();
    const g = parse("g(w, x, y, z) = x").evaluate();
    const h = parse("h = g").evaluate(new Map(Object.entries({ g })));
    expect(f).toHaveLength(3);
    expect(g).toHaveLength(4);
    expect(h).toHaveLength(4);
  });

  it("Evaluates vectors/matrices to arrays", () => {
    const a = parse("[1,2,3, 4]").evaluate();
    const b = parse("[[1,2],[3,4]]").evaluate();
    expect(a).toStrictEqual([1, 2, 3, 4]);
    expect(b).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("Evaluates functions returning vectors/matrices to funcs returning arrays", () => {
    const f = parse("f() = [1,2,3, 4]").evaluate() as CallableFunction;
    const g = parse("g() = [[1,2],[3,4]]").evaluate() as CallableFunction;
    expect(f()).toStrictEqual([1, 2, 3, 4]);
    expect(g()).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("Functions that throw errors hint at their origin", () => {
    const nodeF = parse("f(x) = 2^[1,2,3]");
    const f = nodeF.evaluate() as (x: number) => unknown;
    expect(() => f(1)).toThrowError(
      /Error evaluating f: Unexpected type of argument in function pow/,
    );

    const nodeG = parse("g = f");
    const g = nodeG.evaluate(new Map([["f", f]])) as (x: number) => unknown;
    expect(() => g(1)).toThrowError(
      /Error evaluating f: Unexpected type of argument in function pow/,
    );
  });
});

describe("parsing derivatives", () => {
  const { parse } = parser;
  test.each([
    "\\frac{\\differentialD x^3}{\\differentialD x}",
    "\\frac{\\partial x^3}{\\partial x}",
  ])("simple derivative", (expr) => {
    const node = parse(expr);
    expect(node.toString()).toBe("diff(_f(x$0) = x$0 ^ (3), x)");
  });

  test("top with parens", () => {
    const node = parse("\\frac{\\differentialD(x^3)}{\\differentialD x}");
    expect(node.toString()).toBe("diff(_f(x$0) = x$0 ^ (3), x)");
  });

  test.each([
    {
      varname: "x",
      expected: "diff(_f(x$0) = f(x$0 + y, 3 x$0 + z), x)",
      expectedDeps: new Set(["diff", "f", "x", "y", "z"]),
    },
    {
      varname: "y",
      expected: "diff(_f(y$0) = f(x + y$0, 3 x + z), y)",
      expectedDeps: new Set(["diff", "f", "x", "y", "z"]),
    },
    {
      varname: "z",
      expected: "diff(_f(z$0) = f(x + y, 3 x + z$0), z)",
      expectedDeps: new Set(["diff", "f", "x", "y", "z"]),
    },
  ])("partial derivatives", ({ varname, expected, expectedDeps }) => {
    const node = parse(
      `\\frac{\\differentialD f(x + y, 3x + z)}{\\differentialD ${varname}}`,
    );
    expect(node.toString()).toBe(expected);
    expect(node.dependencies).toEqual(expectedDeps);
  });

  test("nested derivatives", () => {
    const nested = "\\frac{\\differentialD x^3}{\\differentialD x} + 2x^2";
    const node = parse(
      `\\frac{\\differentialD (${nested})}{\\differentialD x}`,
    );
    expect(node.toString()).toBe(
      "diff(_f(x$0) = diff(_f(x$1) = x$1 ^ (3), x$0) + 2 x$0 ^ (2), x)",
    );
    expect(node.dependencies).toEqual(new Set(["diff", "x"]));
  });

  test("Expressions with bad differentialD throw error", () => {
    expect(() => {
      parse("differentialD + x");
    }).toThrow("Could not parse derivative");
  });
});

test("Small imaginary numbers are truncated", () => {
  const { parse } = parser;
  expect(parse("I^2").evaluate()).toBe(-1);
  expect(parse("1+1e-11I").evaluate()).toBe(1);
});
