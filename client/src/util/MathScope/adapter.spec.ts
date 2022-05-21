import * as math from "mathjs";
import { anonParse } from "./adapter";

describe("anonParsed dependencies", () => {
  it("returns a set of symbol dependencies", () => {
    const node = anonParse("a + (b + c)^2 + g(x, sin(y)) + 123/pi");
    expect(node.dependencies).toStrictEqual(
      new Set(["a", "b", "c", "g", "x", "y", "sin", "pi"])
    );
  });

  it("does not include arguments or name for function assignment", () => {
    const node = anonParse("f(x, y) = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g"]));
  });

  it("does not include symbol name for assignment", () => {
    const node = anonParse("f = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g", "x", "y"]));
  });

  it("returns the symbol itself for SymbolNode", () => {
    const node = anonParse("pi");
    expect(math.parse("pi")).toBeInstanceOf(math.SymbolNode);
    expect(node.dependencies).toStrictEqual(new Set(["pi"]));
  });
});

describe("MathNode.evaluate", () => {
  it("includes arity (f.length) on results that are functions", () => {
    const f = anonParse("f(x, y) = x + y").compile().evaluate();
    const g = anonParse("g(x, y, z) = x").compile().evaluate();
    expect(f).toHaveLength(2);
    expect(g).toHaveLength(3);
  });

  it("Evaluates vectors/matrices to arrays", () => {
    const a = anonParse("[1,2,3, 4]").compile().evaluate();
    const b = anonParse("[[1,2],[3,4]]").compile().evaluate();
    expect(a).toStrictEqual([1, 2, 3, 4]);
    expect(b).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("Evaluates functions returning vectors/matrices to funcs returning arrays", () => {
    const f = anonParse("f() = [1,2,3, 4]")
      .compile()
      .evaluate() as CallableFunction;
    const g = anonParse("g() = [[1,2],[3,4]]")
      .compile()
      .evaluate() as CallableFunction;
    expect(f()).toStrictEqual([1, 2, 3, 4]);
    expect(g()).toStrictEqual([
      [1, 2],
      [3, 4],
    ]);
  });
});
