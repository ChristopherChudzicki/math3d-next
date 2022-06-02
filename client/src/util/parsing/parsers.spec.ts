import { latexParser as parser } from "./parsers";

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
