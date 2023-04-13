import { test, expect } from "vitest";
import { parse } from "mathjs";
import getDependencies from "./getDependencies";

test.each([
  {
    expr: "1 + [x, y, z/w]",
    symbols: ["x", "y", "z", "w"],
  },
  {
    expr: "f(g(x), r_2) + x^2 - a",
    symbols: ["f", "g", "r_2", "x", "a"],
  },
])("getDependencies returns symbols used in give node", ({ expr, symbols }) => {
  const node = parse(expr);
  const dependencies = getDependencies(node);
  expect(dependencies).toEqual(new Set(symbols));
});

test("getDependencies returns symbols used in right-hand side of AssignmentNode", () => {
  const node = parse("x = 1 + [y, z]");
  const dependencies = getDependencies(node);
  // NOT "x"
  expect(dependencies).toEqual(new Set(["y", "z"]));
});

test("getDependencies returns symbols used in right-hand side of FunctionAssignmentNode", () => {
  const node = parse("f(a) = a^2 + b + c");
  const dependencies = getDependencies(node);
  // NOT "a"
  expect(dependencies).toEqual(new Set(["b", "c"]));
});

test("getDependencies returns only symbols used in right-hand side of nested FunctionAssignmentNode", () => {
  const node = parse("diff(_f(x$0) = f(x$0, y), x)");
  const dependencies = getDependencies(node);
  // NOT "a"
  expect(dependencies).toEqual(new Set(["diff", "f", "x", "y"]));
});
