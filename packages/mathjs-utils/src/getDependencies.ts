import type * as math from "mathjs";
import {
  isAssignmentNode,
  isFunctionAssignmentNode,
  isIndexNode,
  isSymbolNode,
} from "mathjs";

/**
 * Returns the symbols that are used in the given node.
 *
 * Notes:
 *  - for AssignmentNodes and FunctionAssignmentNodes, only symbols used in the
 *    right-hand side are returned.
 *  - `end` inside an index (`a[end]`) is the indexed object's size, not a
 *    symbol from scope.
 */
const getDependencies = (node: math.MathNode): Set<string> => {
  const omit = new Set<string>();
  const indexEnds = new Set<math.MathNode>();
  const dependencies = new Set<string>();
  // traverse visits a node before its children, so an IndexNode marks its
  // `end`s before they are reached.
  node.traverse((n) => {
    if (isIndexNode(n)) {
      n.dimensions.forEach((d) =>
        d.traverse((s) => {
          if (isSymbolNode(s) && s.name === "end") indexEnds.add(s);
        }),
      );
    } else if (isAssignmentNode(n)) {
      omit.add(n.name);
    } else if (isFunctionAssignmentNode(n)) {
      omit.add(n.name);
      n.params.forEach((p) => omit.add(p));
    } else if (isSymbolNode(n) && !omit.has(n.name) && !indexEnds.has(n)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

export default getDependencies;
