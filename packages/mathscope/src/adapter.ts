import type { MathJsInstance } from "mathjs";
import { getDependencies } from "@math3d/mathjs-utils";

import type { AnonMathNode, Parse } from "./interfaces";
import { MathNodeType, Evaluate } from "./interfaces";

export type ParseableObj = {
  expr: string;
};
export type Parseable = ParseableObj | string;

type MathjsLike = Pick<
  MathJsInstance,
  "parse" | "isFunctionAssignmentNode" | "isAssignmentNode"
>;

class SimplerMathJsParser {
  private math: MathjsLike;

  constructor(mathJs: MathjsLike) {
    this.math = mathJs;
  }

  convertNode = (mjsNode: math.MathNode, evaluate: Evaluate): AnonMathNode => {
    const { math } = this;
    const dependencies = getDependencies(mjsNode);
    if (math.isFunctionAssignmentNode(mjsNode)) {
      return {
        type: MathNodeType.FunctionAssignmentNode,
        name: mjsNode.name,
        params: mjsNode.params,
        evaluate,
        dependencies,
        toString: () => mjsNode.toString(),
      };
    }
    if (math.isAssignmentNode(mjsNode)) {
      return {
        type: MathNodeType.ValueAssignment,
        name: mjsNode.name,
        evaluate,
        dependencies,
        toString: () => mjsNode.toString(),
      };
    }
    return {
      type: MathNodeType.Value,
      evaluate,
      dependencies,
      toString: () => mjsNode.toString(),
    };
  };

  parse: Parse<Parseable> = (parseable) => {
    const { math } = this;
    const parseableObj =
      typeof parseable === "string" ? { expr: parseable } : parseable;
    const mjsNode = math.parse(parseableObj.expr);
    const { evaluate } = mjsNode.compile();
    return this.convertNode(mjsNode, evaluate);
  };
}

export { SimplerMathJsParser };
