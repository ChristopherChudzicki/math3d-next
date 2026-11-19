import { describe, expect, test } from "vitest";
import { latexParser as parser } from "../parsers";

const scope = new Map<string, unknown>([
  ["x", 0.5],
  ["y", 2],
  ["theta", 1],
  ["phi", 0.7],
]);
const evaluate = (latex: string) => parser.parse(latex).evaluate(scope);

const x = 0.5;
const y = 2;

describe("a function name followed by one factor is a call", () => {
  test.each([
    [String.raw`\sin\pi`, Math.sin(Math.PI)],
    [String.raw`\ln x`, Math.log(x)],
    [String.raw`\sin x^2`, Math.sin(x ** 2)],
    [String.raw`2\sin x`, 2 * Math.sin(x)],
    [String.raw`-\sin x`, -Math.sin(x)],
    [String.raw`e^{-\sin x}`, Math.exp(-Math.sin(x))],
    [String.raw`\sin\theta\cos\phi`, Math.sin(1) * Math.cos(0.7)],
    [String.raw`\sin x+1`, Math.sin(x) + 1],
    [String.raw`\sin x\cdot y`, Math.sin(x) * y],
    [String.raw`\sin x/2`, Math.sin(x) / 2],
    [String.raw`y/\sin x`, y / Math.sin(x)],
    [String.raw`\sin\frac{x}{2}`, Math.sin(x / 2)],
    [String.raw`\operatorname{abs}x`, Math.abs(x)],
    [String.raw`\operatorname{\mathrm{abs}}x`, Math.abs(x)],
    [String.raw`\sinh x`, Math.sinh(x)],
    [String.raw`\operatorname{arcsinh}x`, Math.asinh(x)],
    [String.raw`\sin\sin x`, Math.sin(Math.sin(x))],
  ])("%s", (latex, expected) => {
    expect(evaluate(latex)).toBeCloseTo(expected);
  });
});

test.each([String.raw`\sin(x)`, String.raw`\sin\left(x\right)`])(
  "saved form %s parses as before",
  (latex) => {
    expect(evaluate(latex)).toBeCloseTo(Math.sin(x));
  },
);

test("a subscripted command keeps its subscript", () => {
  expect(() => evaluate(String.raw`\log_{2}x`)).toThrow(
    "Undefined symbol log_2x",
  );
});

describe("errors", () => {
  const sinParens = "Put the argument of sin in parentheses, like sin(…).";
  test.each([
    [String.raw`\sin 2x`, sinParens],
    [String.raw`\sin2x`, sinParens],
    [String.raw`\sin x y`, sinParens],
    [String.raw`x\sin`, sinParens],
    [String.raw`\sin-x`, sinParens],
    [
      String.raw`\operatorname{root}x`,
      "Put the arguments of root in parentheses, like root(…, …).",
    ],
    [String.raw`\sin^2\theta`, "Write sin^2 … as sin(…)^2."],
    [
      String.raw`\sin^{-1}x`,
      "For the inverse, use arcsin(…); for 1/sin(…), write sin(…)^-1.",
    ],
    [String.raw`\exp^{-1}x`, "Write exp^-1 … as exp(…)^-1."],
  ])("%s", (latex, message) => {
    expect(() => parser.parse(latex)).toThrow(message);
  });
});
