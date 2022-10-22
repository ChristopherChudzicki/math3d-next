import { EvaluationError } from "@/util/MathScope";
import { assertInstanceOf } from "../predicates";
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
    const expected = "1 + (1 + cos(x))/(1 - cos(x))";
    expect(parser.preprocess(input)).toBe(expected);
  });

  test("converts multiple fractions correctly", () => {
    const input = "x + \\frac{a + \\frac{b + c}{d - e}}{f + g}";
    const expected = "x + (a + (b + c)/(d - e))/(f + g)";
    expect(parser.preprocess(input)).toBe(expected);
  });
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
  test("operatorname is removed", () => {
    const input = "1 + \\operatorname{sin}(1+\\operatorname{woof}(x)) + y";
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

describe("Parsing assignments", () => {
  const getParseError = (
    lhs: string,
    rhs: string,
    Err = DetailedAssignmentError
  ) => {
    try {
      parser.parse({ lhs, rhs, type: "assignment" });
    } catch (err) {
      if (!(err instanceof Err)) {
        throw new Error(`Expected an instanceof ${Err.name}`);
      }
      return err;
    }
    throw new Error("Expected parser.parse to throw.");
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
    if (typeof evaluated !== "function") {
      throw new Error("Expected evaluated to be a function.");
    }
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
  ])("Associates parse errors with lhs or rhs", ({ lhs, rhs, expected }) => {
    const err = getParseError(lhs, rhs);
    const methods = {
      lhs: expected.lhsErr ? "toMatch" : "toBe",
      rhs: expected.rhsErr ? "toMatch" : "toBe",
    };
    expect(err.lhs)[methods.lhs](expected.lhsErr);
    expect(err.rhs)[methods.rhs](expected.rhsErr);
  });

  it("Associates bad parameters with their indexes", () => {
    const err = getParseError("f(x,y,w+,z,z)", "1");
    assertInstanceOf(err, DetailedAssignmentError);
    assertInstanceOf(err.lhs, ParameterErrors);

    expect(Object.keys(err.lhs.paramErrors)).toEqual(["2", "3", "4"]);
    expect(err.lhs.paramErrors[2]).toMatch(
      /"w\+" is not a valid parameter name/
    );
    expect(err.lhs.paramErrors[3]).toMatch(/Parameter names must be unique./);
    expect(err.lhs.paramErrors[4]).toMatch(/Parameter names must be unique./);
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

  it("throws an error for functions that throw errors when evauated", () => {
    const node = parse("f(x) = 2^[1,2,3]");
    expect(() => node.evaluate()).toThrow(EvaluationError);
    expect(() => node.evaluate()).toThrow(
      /Unexpected type of argument in function pow/
    );
  });
});
