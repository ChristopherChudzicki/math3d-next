import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";

const unwrap = (node: mjs.MathNode): mjs.MathNode =>
  math.isParenthesisNode(node) ? unwrap(node.content) : node;

/** Whether `body` is a call `mod(g, 1)`. Says nothing of what `mod` names. */
const isModOne = (body: mjs.MathNode): boolean => {
  const node = unwrap(body);
  if (
    !math.isFunctionNode(node) ||
    !math.isSymbolNode(node.fn) ||
    node.fn.name !== "mod" ||
    node.args.length !== 2
  ) {
    return false;
  }
  const period = unwrap(node.args[1]);
  return math.isConstantNode(period) && period.value === 1;
};

export { isModOne };
