import { describe, it, expect } from "vitest";
import * as math from "mathjs";

import { parse } from "./adapter";

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
