import * as math from "mathjs";
import { anonParse, parse, ParseOptions } from "./adapter";

describe.each([
  { parser: anonParse },
  { parser: (expr: string) => parse(expr, "some-id") },
])("MathNode.dependencies implementation", ({ parser }) => {
  it("returns a set of symbol dependencies", () => {
    const node = parser("a + (b + c)^2 + g(x, sin(y)) + 123/pi");
    expect(node.dependencies).toStrictEqual(
      new Set(["a", "b", "c", "g", "x", "y", "sin", "pi"])
    );
  });

  it("does not include arguments or name for function assignment", () => {
    const node = parser("f(x, y) = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g"]));
  });

  it("does not include symbol name for assignment", () => {
    const node = parser("f = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g", "x", "y"]));
  });

  it("returns the symbol itself for SymbolNode", () => {
    const node = parser("pi");
    expect(math.parse("pi")).toBeInstanceOf(math.SymbolNode);
    expect(node.dependencies).toStrictEqual(new Set(["pi"]));
  });
});

describe("ParseOptions.validate", () => {
  const resultTypes = [
    { expr: "1" },
    { expr: "[1,2,3]" },
    { expr: "f() = 1" },
    { expr: "f() = [1,2,3]" },
  ];

  test.each(resultTypes)("evaluate throws when validate throws", ({ expr }) => {
    const parseOptions: ParseOptions = {
      validate: jest.fn(() => {
        throw new Error("some test error");
      }),
    };

    const node = parse(expr, "some-id", parseOptions);
    const { evaluate } = node.compile();
    expect(evaluate).toThrow(/some test error/);
  });

  test.each(resultTypes)(
    "evaluate calls validate with value and MathJS node",
    ({ expr }) => {
      const parseOptions: ParseOptions = { validate: jest.fn() };
      const mjsNode = math.parse(expr);

      const node = parse(expr, "some-id", parseOptions);
      const { evaluate } = node.compile();
      const result = evaluate();
      expect(parseOptions.validate).toHaveBeenCalledTimes(1);
      expect(parseOptions.validate).toHaveBeenCalledWith(result, mjsNode);
    }
  );
});

describe.each([
  { parser: anonParse },
  { parser: (expr: string) => parse(expr, "some-id") },
])("MathNode.evaluate", ({ parser }) => {
  it("includes arity (f.length) on results that are functions", () => {
    const f = parser("f(x, y) = x + y").compile().evaluate();
    const g = parser("g(x, y, z) = x").compile().evaluate();
    expect(f).toHaveLength(2);
    expect(g).toHaveLength(3);
  });

  it("Evaluates vectors/matrices to arrays", () => {
    const a = parser("[1,2,3, 4]").compile().evaluate();
    const b = parser("[[1,2],[3,4]]").compile().evaluate();
    expect(a).toStrictEqual([1, 2, 3, 4]);
    expect(b).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("Evaluates functions returning vectors/matrices to funcs returning arrays", () => {
    const f = parser("f() = [1,2,3, 4]")
      .compile()
      .evaluate() as CallableFunction;
    const g = parser("g() = [[1,2],[3,4]]")
      .compile()
      .evaluate() as CallableFunction;
    expect(f()).toStrictEqual([1, 2, 3, 4]);
    expect(g()).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
