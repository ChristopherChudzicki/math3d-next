import * as math from "mathjs";

import { parse } from "./adapter";
import { EvaluationError } from "./errors";

describe("parse dependencies", () => {
  it("returns a set of symbol dependencies", () => {
    const node = parse("a + (b + c)^2 + g(x, sin(y)) + 123/pi");
    expect(node.dependencies).toStrictEqual(
      new Set(["a", "b", "c", "g", "x", "y", "sin", "pi"])
    );
  });

  it("does not include arguments or name for function assignment", () => {
    const node = parse("f(x, y) = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g"]));
  });

  it("does not include symbol name for assignment", () => {
    const node = parse("f = a*x + g(y)");
    expect(node.dependencies).toStrictEqual(new Set(["a", "g", "x", "y"]));
  });

  it("returns the symbol itself for SymbolNode", () => {
    const node = parse("pi");
    expect(math.parse("pi")).toBeInstanceOf(math.SymbolNode);
    expect(node.dependencies).toStrictEqual(new Set(["pi"]));
  });
});

describe("MathNode.evaluate", () => {
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
