import type * as mjs from "mathjs";
import math from "@math3d/custom-mathjs";
import { MathJsRule, ParserRuleType } from "../interfaces";

/** `node` without the parentheses and signs around it. */
const unsigned = (node: mjs.MathNode): mjs.MathNode => {
  if (math.isParenthesisNode(node)) return unsigned(node.content);
  if (
    math.isOperatorNode(node) &&
    (node.fn === "unaryMinus" || node.fn === "unaryPlus")
  ) {
    return unsigned(node.args[0]);
  }
  return node;
};

const wholeLiteral = (node: mjs.MathNode): number | undefined => {
  const literal = unsigned(node);
  return math.isConstantNode(literal) && Number.isSafeInteger(literal.value)
    ? literal.value
    : undefined;
};

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * For an exponent written as a fraction p/q of whole numbers with q odd in
 * lowest terms, as 1/3, \frac{2}{6} and -(5/7) are: whether p is then odd or
 * even. Undefined for any other exponent, such as 1/2, 0.2 or 1/n.
 */
const numeratorParity = (node: mjs.MathNode): "Odd" | "Even" | undefined => {
  const fraction = unsigned(node);
  // \frac{p}{q} reaches mathjs as divide(p, q), and p/q as an operator.
  const isDivide =
    (math.isOperatorNode(fraction) && fraction.fn === "divide") ||
    (math.isFunctionNode(fraction) && fraction.fn.name === "divide");
  if (!isDivide || fraction.args.length !== 2) return undefined;
  // mathjs parses 20% as divide(20, 100).
  if ("isPercentage" in fraction && fraction.isPercentage) return undefined;
  const [p, q] = fraction.args.map(wholeLiteral);
  if (p === undefined || !q) return undefined;
  const common = gcd(p, q);
  if ((q / common) % 2 === 0) return undefined;
  return (p / common) % 2 === 0 ? "Even" : "Odd";
};

const isPow = (
  node: mjs.MathNode,
): node is mjs.OperatorNode | mjs.FunctionNode =>
  (math.isOperatorNode(node) && node.fn === "pow") ||
  (math.isFunctionNode(node) && node.fn.name === "pow");

// Children first: node.transform doesn't visit a replacement's children, so
// it would miss the inner power of (x^(1/3))^(1/3).
const rewrite = (node: mjs.MathNode): mjs.MathNode => {
  const mapped = node.map(rewrite);
  if (!isPow(mapped) || mapped.args.length !== 2) return mapped;
  const parity = numeratorParity(mapped.args[1]);
  if (!parity) return mapped;
  return new math.FunctionNode(
    new math.SymbolNode(`$realPow${parity}`),
    mapped.args,
  );
};

/**
 * Rewrites a power whose exponent is written as an odd-denominator fraction
 * to $realPowOdd or $realPowEven, which give a negative base its real root.
 * Spelling decides, not value: a slider exponent would otherwise switch
 * roots as it passes through fractions.
 */
const realRootRule: MathJsRule = {
  type: ParserRuleType.MathJs,
  transform: rewrite,
};

export default realRootRule;
