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
});
