import * as math from "mathjs";

// eslint-disable-next-line no-underscore-dangle
const _getDependencies = (
  node: math.MathNode,
  omit: Set<string> = new Set([])
): Set<string> => {
  if (node.type === "AssignmentNode") return _getDependencies(node.value);
  if (node.type === "FunctionAssignmentNode") {
    return _getDependencies(node.expr, new Set(node.params));
  }
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (n.type === "SymbolNode" && !omit.has(n.name)) {
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
