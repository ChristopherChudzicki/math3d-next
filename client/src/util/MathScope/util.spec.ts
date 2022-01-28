import { parse, SymbolNode } from "mathjs";
import { getDependencies, getDuplicateAssignments } from "./util";

describe("getDependencies", () => {
  it("returns a set of symbol dependencies", () => {
    const node = parse("a + (b + c)^2 + g(x, sin(y)) + 123/pi");
    expect(getDependencies(node)).toStrictEqual(
      new Set(["a", "b", "c", "g", "x", "y", "sin", "pi"])
    );
  });

  it("does not include arguments for function assignment", () => {
    const node = parse("f(x, y) = a*x + g(y)");
    expect(getDependencies(node)).toStrictEqual(new Set(["a", "g"]));
  });

  it("returns the symbol itself for SymbolNode", () => {
    const node = parse("pi");
    expect(node).toBeInstanceOf(SymbolNode);
    expect(getDependencies(node)).toStrictEqual(new Set(["pi"]));
  });
});

describe("getDuplicateAssignments", () => {
  it("gets duplicate Assignment and FunctionAssignment nodes", () => {
    const a1 = parse("a = 1");
    const a2 = parse("a = 2");
    const f1 = parse("f = 2");
    const f2 = parse("f(x) = x");
    const otherNodes = [
      parse("b = 0"),
      parse("c = 0"),
      parse("a + b"),
      parse("x + y"),
    ];
    const nodes = [a1, a2, f1, f2, ...otherNodes];
    const expectedDuplicates = new Set([a1, a2, f1, f2]);
    expect(getDuplicateAssignments(nodes)).toStrictEqual(expectedDuplicates);
  });
});
