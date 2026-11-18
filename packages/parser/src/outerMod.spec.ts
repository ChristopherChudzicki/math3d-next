import { describe, expect, test } from "vitest";
import math from "@math3d/custom-mathjs";
import { latexParser as parser } from "./parsers";
import { isModOne } from "./outerMod";
import { wrapsAtOne } from "./evaluate";

const parse = (latex: string) => math.parse(parser.preprocess(latex));

describe("isModOne", () => {
  test.each([
    "\\left(mod(Z, (1))\\right)",
    "\\operatorname{mod}(\\frac{Z}{2}, 1)",
  ])("is true of %s", (latex) => {
    expect(isModOne(parse(latex))).toBe(true);
  });

  test.each(["mod(Z, 2)", "mod(Z, a)", "mod(Z, 1) + mod(X, 1)"])(
    "is false of %s",
    (latex) => {
      expect(isModOne(parse(latex))).toBe(false);
    },
  );
});

describe("wrapsAtOne", () => {
  const evaluate = (rhs: string, params: string[], scope = new Map()) =>
    parser
      .parse({ type: "function-assignment", name: "f", params, rhs })
      .evaluate(scope) as (...args: number[]) => number;

  test("is true of a function evaluated from mod(g, 1)", () => {
    expect(wrapsAtOne(evaluate("mod(2 x, 1)", ["x"]))).toBe(true);
  });

  test.each([
    {
      name: "the scope defines its own mod",
      params: ["x"],
      scope: new Map([["mod", (a: number) => a + 10]]),
    },
    { name: "a parameter is named mod", params: ["x", "mod"] },
  ])("is false when $name", ({ params, scope }) => {
    expect(wrapsAtOne(evaluate("mod(x, 1)", params, scope))).toBe(false);
  });
});
