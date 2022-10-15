import { assertInstanceOf } from "@/test_util";
import { EvaluationError } from "@/util/MathScope";
import { latexParser as parser } from "./parsers";
import { ParseAssignmentLHSError } from "./rules";

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

describe("validateAssignmentLHS", () => {
  const getParseError = (s: string) => {
    try {
      parser.parse(s);
    } catch (err) {
      return err;
    }
    throw new Error("Expected parser.parse to throw.");
  };

  it("throws ParseAssignmentLHSError if LHS is invalid", () => {
    const input = "f(x+) = 123";
    const shouldThrow = () => parser.parse(input);
    expect(shouldThrow).toThrow(ParseAssignmentLHSError);
  });

  it("throws non-ParseAssignmentLHSError if RHS is invalid", () => {
    const input = "f(x) = 123 +";
    const shouldThrow = () => parser.parse(input);
    expect(shouldThrow).toThrow();
    expect(shouldThrow).not.toThrow(ParseAssignmentLHSError);
  });

  it.each(["123", "f(x)=123", "a=123"])(
    "does not throw for valid assignments or valid non-assignments",
    (text) => {
      const shouldNotThrow = () => parser.parse(text);
      expect(shouldNotThrow).not.toThrow();
    }
  );

  it("Records invalid parameter positions", () => {
    const expr = "f(x,y+z,a, z-1, w) = 1";
    const err = getParseError(expr);
    assertInstanceOf(err, ParseAssignmentLHSError);
    expect(err.details).toEqual({
      isFunctionAssignment: true,
      paramErrors: {
        1: new Error('"y+z" is not a valid parameter name.'),
        3: new Error('"z-1" is not a valid parameter name.'),
      },
    });
  });

  it("Records duplicate parameter names", () => {
    const expr = "f(x,y,y,z) = 1";
    const err = getParseError(expr);
    assertInstanceOf(err, ParseAssignmentLHSError);
    expect(err.details).toEqual({
      isFunctionAssignment: true,
      paramErrors: {
        1: new Error("Parameter names must be unique."),
        2: new Error("Parameter names must be unique."),
      },
    });
  });

  it("Treats duplicate errors as errors, not dupes", () => {
    const expr = "f(x+, x+) = 1";
    const err = getParseError(expr);
    assertInstanceOf(err, ParseAssignmentLHSError);
    expect(err.details).toEqual({
      isFunctionAssignment: true,
      paramErrors: {
        0: new Error('"x+" is not a valid parameter name.'),
        1: new Error('"x+" is not a valid parameter name.'),
      },
    });
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
