import { describe, it, test, expect } from "vitest";
import math, { principalPow } from "./mathjs";

describe("mathjs instance", () => {
  it("defines trig functions", () => {
    expect(math.sin).toBeDefined();
    expect(math.cos).toBeDefined();
    expect(math.tan).toBeDefined();
    expect(math.asin).toBeDefined();
    expect(math.acos).toBeDefined();
    expect(math.atan).toBeDefined();

    expect(math.sec).toBeDefined();
    expect(math.csc).toBeDefined();
    expect(math.cot).toBeDefined();
    expect(math.asec).toBeDefined();
    expect(math.acsc).toBeDefined();
    expect(math.acot).toBeDefined();
  });

  it("takes y first in 2-argument arctan, like atan2(y, x)", () => {
    expect(math.evaluate("arctan(1, -2)")).toBeCloseTo(Math.atan2(1, -2));
    expect(math.evaluate("arctan(1)")).toBeCloseTo(Math.PI / 4);
  });

  test.each([
    { expr: "[10, 20, 30][1]", expected: 10 },
    { expr: "[10, 20, 30][end]", expected: 30 },
    { expr: "[10, 20, 30][2:3]", expected: [20, 30] },
    { expr: "[10, 20, 30][:]", expected: [10, 20, 30] },
    { expr: "map([10, 20], f(x, i) = i[1])", expected: [1, 2] },
    { expr: "1:3", expected: [1, 2, 3] },
    { expr: "column([1, 2; 3, 4], 1)", expected: [[1], [3]] },
    { expr: "max([1, 5; 3, 2], 1)", expected: [3, 5] },
    { expr: "min([1, 5; 3, 2], 2)", expected: [1, 2] },
    { expr: "sum([1, 5; 3, 2], 2)", expected: [6, 5] },
    { expr: "mean([1, 5; 3, 2], 1)", expected: [2, 3.5] },
    {
      expr: "concat([1, 2; 3, 4], [5, 6; 7, 8], 1)",
      expected: [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ],
    },
  ])("indexes from 1 in expressions: $expr", ({ expr, expected }) => {
    expect(math.evaluate(expr).valueOf()).toEqual(expected);
  });

  it("indexes diff's Jacobian from 1 with subset and index", () => {
    const F = (x: number, y: number, z: number) => [x * y, y * z, z * x];
    const entry = (i: number, j: number) =>
      math.evaluate("subset(diff(F, 1, 2, 3), index(i, j))", { F, i, j });
    // Row i holds the partials with respect to the i-th variable:
    // [[y, 0, z], [x, z, 0], [0, y, x]] at (1, 2, 3).
    expect(entry(1, 3)).toBeCloseTo(3);
    expect(entry(3, 2)).toBeCloseTo(2);
  });

  it("reports an out-of-range index from 1", () => {
    expect(() => math.evaluate("subset([1, 2, 3], index(4))")).toThrow(
      "Index out of range (4 > 3)",
    );
  });

  it("defines hyperbolic trig functions", () => {
    expect(math.sinh).toBeDefined();
    expect(math.cosh).toBeDefined();
    expect(math.tanh).toBeDefined();
    expect(math.asinh).toBeDefined();
    expect(math.acosh).toBeDefined();
    expect(math.atanh).toBeDefined();

    expect(math.sech).toBeDefined();
    expect(math.csch).toBeDefined();
    expect(math.coth).toBeDefined();
    expect(math.asech).toBeDefined();
    expect(math.acsch).toBeDefined();
    expect(math.acoth).toBeDefined();
  });

  it("defines exp functions", () => {
    expect(math.exp).toBeDefined();
    expect(math.log).toBeDefined();
    expect(math.log2).toBeDefined();
    expect(math.log10).toBeDefined();
    // @ts-expect-error added by me
    expect(math.ln).toBeDefined();
  });

  // math3d-react imported these from mathjs 3, whose conventions mathjs 15
  // keeps: min/max/sum/mean take either several scalars or one matrix.
  it.each([
    ["max(1, 5, 3)", 5],
    ["max([1, 5, 3])", 5],
    ["min(2, -1)", -1],
    ["sum(1, 2, 3)", 6],
    ["sum([[1, 2], [3, 4]])", 10],
    ["mean([1, 2, 3])", 2],
    ["arg(-1)", Math.PI],
    ["lcm(4, 6)", 12],
    ["ones(3)", [1, 1, 1]],
    ["dotMultiply([1, 2, 3], [4, 5, 6])", [4, 10, 18]],
  ])("evaluates %s like math3d-react", (expr, expected) => {
    expect(math.evaluate(expr).valueOf()).toEqual(expected);
  });

  it.each([
    ["(-8)^(1/3)", "-2"],
    ["pow(-8, 2/3)", "4"],
    ["(-32)^0.2", "-2"],
    ["(-8)^(1/2)", "2.82843i"],
    ["(-8 + 0I)^(1/3)", "1 + 1.73205i"],
    ["8^(1/3)", "2"],
    ["(-2)^3", "-8"],
    ["[1, 2; 3, 4]^2", "[[7, 10], [15, 22]]"],
  ])(
    "a negative number takes a real root where it has one: %s",
    (expr, expected) => {
      expect(math.format(math.evaluate(expr), 6)).toBe(expected);
    },
  );

  it("keeps mathjs's own pow as principalPow", () => {
    expect(math.format(principalPow(-8, 1 / 3), 6)).toBe("1 + 1.73205i");
  });

  it("defines expected constants", () => {
    expect(math.i).toEqual([1, 0, 0]);
    expect(math.j).toEqual([0, 1, 0]);
    expect(math.k).toEqual([0, 0, 1]);
    expect(math.uniti).toEqual([1, 0, 0]);
    expect(math.unitj).toEqual([0, 1, 0]);
    expect(math.unitk).toEqual([0, 0, 1]);
    expect(math.unitx).toEqual([1, 0, 0]);
    expect(math.unity).toEqual([0, 1, 0]);
    expect(math.unitz).toEqual([0, 0, 1]);
    expect(math.I.re).toBe(0);
    expect(math.I.im).toBe(1);
  });
});
