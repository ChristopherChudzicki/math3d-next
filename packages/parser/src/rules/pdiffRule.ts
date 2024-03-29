import type * as mjs from "mathjs";
import math from "@math3d/custom-mathjs";
import { MathJsRule, ParserRuleType } from "../interfaces";

const isDiffSymbolName = (name: string) => {
  return name === "differentialD" || name === "partial";
};

/**
 * Decide whether a MathNode should be interpretted as part of a derivative.
 *
 * We accept two forms of derivatives:
 *  - dd f(x) / dd x
 *  - dd(f(x)) / dd x
 *
 * where `dd` stands for `differentialD`. Three cases:
 *  1. Bottom: implicit multiplication of dd and the differential variable
 *  2. Top: implicit multiplication of dd and the expression being differentiated
 *  3. Top: FunctionNode with function name `dd` and a single arg that is the
 *     expression being differentiated.
 *
 * The function returns either the differentiation variable OR the expression
 * being differentiated, or null if the input node is not one of the three cases
 * listed above.
 */
const getDiffNode = (node: mjs.MathNode): mjs.MathNode | null => {
  if (
    math.isFunctionNode(node) &&
    isDiffSymbolName(node.fn.name) &&
    node.args.length === 1
  ) {
    return node.args[0];
  }
  if (!math.isOperatorNode(node)) return null;
  if (node.op !== "*") return null;
  if (!node.implicit) return null;
  if (node.args.length !== 2) return null;
  const [a, b] = node.args;
  if (!math.isSymbolNode(a)) return null;
  if (!isDiffSymbolName(a.name)) return null;
  return b;
};

const getDummyVarName = (varName: string, depth: number) => {
  const [baseVarName] = varName.split("$");
  return `${baseVarName}$${depth}`;
};

const handleSingleNode = (node: mjs.MathNode, depth: number) => {
  if (!math.isFunctionNode(node)) return node;
  if (node.fn.name !== "divide") return node;
  if (node.args.length !== 2) return node;
  const top = getDiffNode(node.args[0]);
  const bottom = getDiffNode(node.args[1]);
  if (!top || !bottom) return node;
  if (!math.isSymbolNode(bottom)) return node;
  const dummyVar = new math.SymbolNode(getDummyVarName(bottom.name, depth));
  const dummyTop = top.transform((n) => {
    if (math.isSymbolNode(n)) {
      if (n.name === bottom.name) {
        return new math.SymbolNode(dummyVar.name);
      }
    }
    return n;
  });
  const func = new math.FunctionAssignmentNode("_f", [dummyVar.name], dummyTop);
  const diff = new math.FunctionNode(new math.SymbolNode("diff"), [
    func,
    bottom,
  ]);
  return diff;
};

const handleNode = (node: mjs.MathNode, depth = 0): mjs.MathNode => {
  const transformed = node.transform((n) => {
    const handled = handleSingleNode(n, depth);
    if (handled === n) return n;
    return handleNode(handled, depth + 1);
  });
  return transformed;
};

const pdiffRule: MathJsRule = {
  type: ParserRuleType.MathJs,
  transform: (node) => {
    const transformed = handleNode(node);
    transformed.traverse((n) => {
      if (math.isSymbolNode(n) && isDiffSymbolName(n.name)) {
        throw new Error("Could not parse derivative");
      }
    });
    return transformed;
  },
};

export default pdiffRule;
