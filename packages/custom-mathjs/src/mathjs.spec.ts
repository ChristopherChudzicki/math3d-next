import { describe, it, expect } from "vitest";
import math from "./mathjs";

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
