import type * as mjs from "mathjs";
import math from "@math3d/custom-mathjs";
import { MathJsRule, ParserRuleType } from "../interfaces";
import { functionArity } from "./functionNames";

const functionName = (node: mjs.MathNode): string | null =>
  math.isSymbolNode(node) && functionArity(node.name) ? node.name : null;

const isImplicitProduct = (node: mjs.MathNode): node is mjs.OperatorNode =>
  math.isOperatorNode(node) && node.op === "*" && !!node.implicit;

const isUnarySign = (node: mjs.MathNode): node is mjs.OperatorNode =>
  math.isOperatorNode(node) &&
  node.args.length === 1 &&
  (node.fn === "unaryMinus" || node.fn === "unaryPlus");

const missingParens = (name: string) =>
  functionArity(name) === "many"
    ? new Error(
        `Put the arguments of ${name} in parentheses, like ${name}(…, …).`,
      )
    : new Error(`Put the argument of ${name} in parentheses, like ${name}(…).`);

const unwrapParens = (node: mjs.MathNode): mjs.MathNode =>
  math.isParenthesisNode(node) ? unwrapParens(node.content) : node;

const isSimple = (node: mjs.MathNode): boolean =>
  math.isConstantNode(node) ||
  math.isSymbolNode(node) ||
  (isUnarySign(node) && isSimple(node.args[0]));

const poweredFunction = (name: string, exponent: mjs.MathNode) => {
  const unwrapped = unwrapParens(exponent);
  const k = isSimple(unwrapped) ? unwrapped.toString() : "k";
  if (k === "-1" && functionArity(`arc${name}`)) {
    return new Error(
      `For the inverse, use arc${name}(…); for 1/${name}(…), write ${name}(…)^-1.`,
    );
  }
  return new Error(`Write ${name}^${k} … as ${name}(…)^${k}.`);
};

const flatten = (node: mjs.MathNode): mjs.MathNode[] =>
  isImplicitProduct(node) ? node.args.flatMap(flatten) : [node];

const call = (name: string, arg: mjs.MathNode) =>
  new math.FunctionNode(new math.SymbolNode(name), [arg]);

const implicitProduct = (factors: mjs.MathNode[]) =>
  factors.reduce(
    (acc, f) => new math.OperatorNode("*", "multiply", [acc, f], true),
  );

/**
 * Apply the function named by `factors[i]` to the factor after it; a function
 * name as that factor applies first (`sin sin x`). Returns the call and the
 * index after it.
 */
const apply = (
  factors: mjs.MathNode[],
  i: number,
  name: string,
): [mjs.MathNode, number] => {
  if (functionArity(name) === "many") throw missingParens(name);
  const next = factors[i + 1];
  if (!next) throw missingParens(name);
  const nextName = functionName(next);
  if (nextName) {
    const [inner, end] = apply(factors, i + 1, nextName);
    return [call(name, inner), end];
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return [call(name, rewrite(next)), i + 2];
};

const rewriteProduct = (node: mjs.OperatorNode): mjs.MathNode => {
  const factors = flatten(node);
  const out: mjs.MathNode[] = [];
  let i = 0;
  while (i < factors.length) {
    const f = factors[i];
    const sign =
      i === 0 && isUnarySign(f) && functionName(f.args[0]) ? f : null;
    const name = functionName(sign ? sign.args[0] : f);
    if (!name) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      out.push(rewrite(f));
      i += 1;
    } else {
      const [applied, end] = apply(factors, i, name);
      const after = factors[end];
      // Another function name or an existing call may follow: `sin x cos(y)`.
      if (after && !functionName(after) && !math.isFunctionNode(after)) {
        throw missingParens(name);
      }
      out.push(
        sign ? new math.OperatorNode(sign.op, sign.fn, [applied]) : applied,
      );
      i = end;
    }
  }
  return implicitProduct(out);
};

const rewrite = (node: mjs.MathNode): mjs.MathNode => {
  if (isImplicitProduct(node)) return rewriteProduct(node);
  // mathjs reads `norm [1,2]` as indexing into `norm`.
  if (math.isAccessorNode(node)) {
    const name = functionName(node.object);
    if (name) throw missingParens(name);
  }
  if (math.isOperatorNode(node)) {
    const [base, exponent] = node.args;
    const baseName = functionName(base);
    if (node.op === "^" && baseName && functionArity(baseName) === "one") {
      throw poweredFunction(baseName, exponent);
    }
    const operand = node.args.map(functionName).find((n) => n);
    if (operand) throw missingParens(operand);
  }
  return node.map((child) => rewrite(child));
};

/**
 * A function name followed by one factor is a call: `\sin x` is `sin(x)`.
 * More than one factor (`\sin 2x`) is an error asking for parentheses.
 */
const functionApplicationRule: MathJsRule = {
  type: ParserRuleType.MathJs,
  transform: rewrite,
};

export default functionApplicationRule;
