import { describe, test, expect } from "vitest";
import { makeMathScope, builtins } from "./mathScopeInstance";

describe("makeMathScope", () => {
  test("sin and cos are builtin", () => {
    const mathScope = makeMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "sin(pi/6)" },
      { id: "b", parseable: "cos(pi/3)" },
    ]);
    expect(mathScope.results.get("a")).toBeCloseTo(0.5);
    expect(mathScope.results.get("b")).toBeCloseTo(0.5);
  });

  test("a function can index with end", () => {
    const mathScope = makeMathScope();
    mathScope.setExpressions([
      {
        id: "a",
        parseable: {
          type: "assignment",
          lhs: "a",
          rhs: "\\left[10,20,30\\right]",
        },
      },
      {
        id: "f",
        parseable: {
          type: "function-assignment",
          name: "f",
          params: ["t"],
          rhs: "a\\left[\\operatorname{end}\\right]+t",
        },
      },
      { id: "b", parseable: "f(1)" },
    ]);
    expect(mathScope.errors).toEqual(new Map());
    expect(mathScope.results.get("b")).toBe(31);
  });

  test("without axis items, the axis helpers use the viewport's default range", () => {
    const mathScope = makeMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "\\operatorname{rescale}_x(0)" },
      { id: "b", parseable: "z_{\\operatorname{max}}" },
    ]);
    expect(mathScope.errors).toEqual(new Map());
    expect(mathScope.results.get("a")).toBe(0.5);
    expect(mathScope.results.get("b")).toBe(1);
  });

  test("builtin list has: sin, cos, exp, log...", () => {
    /**
     * Builtins list is via a mathjs property that isn't really documented, so
     * let's just sanity check that it is generating correctly.
     */
    expect(builtins).toContain("sin");
    expect(builtins).toContain("cos");
    expect(builtins).toContain("exp");
    expect(builtins).toContain("log");
  });
});
