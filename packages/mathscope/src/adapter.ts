import * as math from "mathjs";
import { getDependencies } from "@math3d/mathjs-utils";

import type { AnonMathNode, Parse } from "./interfaces";
import { MathNodeType, Evaluate } from "./interfaces";

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
  if (math.isAssignmentNode(mjsNode)) {
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
  return convertNode(mjsNode, evaluate);
};

export { convertNode, parse };
