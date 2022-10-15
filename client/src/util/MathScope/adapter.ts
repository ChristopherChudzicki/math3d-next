import * as math from "mathjs";

import type { AnonMathNode, Parse } from "./interfaces";
import { MathNodeType, Evaluate } from "./interfaces";

window.math = math;

const getDependencies = (
  node: math.MathNode,
  omit: Set<string> = new Set([])
): Set<string> => {
  if (node instanceof math.AssignmentNode) return getDependencies(node.value);
  if (node instanceof math.FunctionAssignmentNode) {
    return getDependencies(node.expr, new Set(node.params));
  }
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (n instanceof math.SymbolNode && !omit.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

export type ParseableObj = {
  expr: string;
};
export type Parseable = ParseableObj | string;

const convertNode = (
  mjsNode: math.MathNode,
  evaluate: Evaluate
): AnonMathNode => {
  const dependencies = getDependencies(mjsNode);
  if (math.isFunctionAssignmentNode(mjsNode)) {
    return {
      type: MathNodeType.FunctionAssignmentNode,
      name: mjsNode.name,
      params: mjsNode.params,
      evaluate,
      dependencies,
    };
  }
  if (mjsNode.type === "AssignmentNode") {
    return {
      type: MathNodeType.ValueAssignment,
      name: mjsNode.name,
      evaluate,
      dependencies,
    };
  }
  return {
    type: MathNodeType.Value,
    evaluate,
    dependencies,
  };
};

const parse: Parse<Parseable> = (parseable) => {
  const parseableObj =
    typeof parseable === "string" ? { expr: parseable } : parseable;
  const mjsNode = math.parse(parseableObj.expr);
  const { evaluate } = mjsNode.compile();
  // const evaluate = getValidatedEvaluate(mjsNode, parseableObj.validate);
  return convertNode(mjsNode, evaluate);
};

export { convertNode, parse };
