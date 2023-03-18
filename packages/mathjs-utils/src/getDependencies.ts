import type * as math from "mathjs";
import {
  isAssignmentNode,
  isFunctionAssignmentNode,
  isSymbolNode,
} from "mathjs";

// eslint-disable-next-line no-underscore-dangle
const _getDependencies = (
  node: math.MathNode,
  omit: Set<string> = new Set([])
): Set<string> => {
  if (isAssignmentNode(node)) return _getDependencies(node.value);
  if (isFunctionAssignmentNode(node)) {
    return _getDependencies(node.expr, new Set(node.params));
  }
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (isSymbolNode(n) && !omit.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

/**
 * Returns the symbols that are used in the given node.
 *
 * Notes:
 *  - for AssignmentNodes and FunctionAssignmentNodes, only symbols used in the
 *    right-hand side are returned.
 */
const getDependencies = (node: math.MathNode): Set<string> =>
  _getDependencies(node);

export default getDependencies;
