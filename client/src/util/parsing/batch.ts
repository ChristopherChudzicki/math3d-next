import * as mjs from "mathjs";
import { batch } from "@/util/batch";
import { AnonMathNode, MathNodeType } from "@/util/MathScope";

import { ParseableObjs } from "./interfaces";

const noOp = () => {};
const batchNodes = (
  nodes: AnonMathNode[],
  mjsNode: mjs.ArrayNode,
  validate: NonNullable<ParseableObjs["array"]["validate"]> = noOp
): AnonMathNode => {
  const evaluate: AnonMathNode["evaluate"] = (scope) => {
    const result = batch(nodes, (node) => node.evaluate(scope));
    validate(result, mjsNode);
    return result;
  };
  const dependencies = new Set(nodes.flatMap((node) => [...node.dependencies]));

  return {
    type: MathNodeType.Value,
    evaluate,
    dependencies,
  };
};

export { batchNodes };
