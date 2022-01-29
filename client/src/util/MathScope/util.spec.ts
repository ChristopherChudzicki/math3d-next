import { parse, SymbolNode } from "mathjs";
import {
  getDependencies,
  getDuplicateAssignments,
  getAssignmentCycles,
} from "./util";

describe("getDependencies", () => {
  it("returns a set of symbol dependencies", () => {
    const node = parse("a + (b + c)^2 + g(x, sin(y)) + 123/pi");
    expect(getDependencies(node)).toStrictEqual(
      new Set(["a", "b", "c", "g", "x", "y", "sin", "pi"])
    );
  });

  it("does not include arguments or name for function assignment", () => {
    const node = parse("f(x, y) = a*x + g(y)");
    expect(getDependencies(node)).toStrictEqual(new Set(["a", "g"]));
  });

  it("does not include symbol name for assignment", () => {
    const node = parse("f = a*x + g(y)");
    expect(getDependencies(node)).toStrictEqual(new Set(["a", "g", "x", "y"]));
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

describe("getAssignmentCycles", () => {
  it("detects cycles", () => {
    const a = parse("a = b^2 + x");
    const b = parse("b = c^2 + y");
    const c = parse("c = a^2 + z");
    const x = parse("x = y^2");
    const y = parse("y = z^2");
    const z = parse("z = 5");
    const s = parse("s = t");
    const t = parse("t = s^2");
    const cycles = getAssignmentCycles([a, b, c, x, y, z, s, t]);
    expect(cycles).toStrictEqual([
      [a, c, b],
      [s, t],
    ]);
  });
});
