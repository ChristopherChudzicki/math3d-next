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
