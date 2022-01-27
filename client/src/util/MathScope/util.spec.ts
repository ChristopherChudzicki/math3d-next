import { parse, SymbolNode } from "mathjs";
import { getDependencies } from "./util";

describe("getDependencies", () => {
  it("returns a set of symbol dependencies", () => {
    const node = parse("f(x) = a + (b + c)^2 + g(y, sin(z)) + 123/pi");
    expect(getDependencies(node)).toStrictEqual(
      new Set(["a", "b", "c", "g", "y", "sin", "z", "pi"])
    );
  });

  it("returns the symbol itself for SymbolNode", () => {
    const node = parse("pi");
    expect(node).toBeInstanceOf(SymbolNode);
    expect(getDependencies(node)).toStrictEqual(new Set(["pi"]));
  });
});
