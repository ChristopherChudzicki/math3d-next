import type * as math from "mathjs";
import {
  isAssignmentNode,
  isFunctionAssignmentNode,
  isSymbolNode,
} from "mathjs";

/**
 * Returns the symbols that are used in the given node.
 *
 * Notes:
 *  - for AssignmentNodes and FunctionAssignmentNodes, only symbols used in the
 *    right-hand side are returned.
 */
const getDependencies = (node: math.MathNode): Set<string> => {
  const omit = new Set<string>();
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (isAssignmentNode(n)) {
      omit.add(n.name);
    } else if (isFunctionAssignmentNode(n)) {
      omit.add(n.name);
      n.params.forEach((p) => omit.add(p));
    } else if (isSymbolNode(n) && !omit.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

export default getDependencies;
