import { groupBy, pipe, prop, filter, flatten, Dictionary } from "ramda";
import {
  AssignmentNode,
  FunctionAssignmentNode,
  MathNode,
  SymbolNode,
} from "mathjs";
import { Graph } from "tarjan-graph";
import { group } from "console";

/**
 * Get the symbol dependencies of a given node. For example,
 * ```ts
 * getDependencies(math.parse('f(x) = a + g(x)'))
 * // Set { 'a', 'g' }
 * ```
 */
export const getDependencies = (node: MathNode): Set<string> => {
  const dependencies = new Set<string>();
  const params = new Set(
    node instanceof FunctionAssignmentNode ? node.params : []
  );
  node.traverse((n) => {
    if (n instanceof SymbolNode && !params.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

type GeneralAssignmentNode = AssignmentNode | FunctionAssignmentNode;
export const isGeneralAssignmentNode = (
  node: unknown
): node is GeneralAssignmentNode => {
  if (node instanceof AssignmentNode) return true;
  if (node instanceof FunctionAssignmentNode) return true;
  return false;
};

export const getDuplicateAssignments = pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  Dictionary<GeneralAssignmentNode[]>,
  GeneralAssignmentNode[][],
  GeneralAssignmentNode[][],
  GeneralAssignmentNode[],
  Set<GeneralAssignmentNode>
>(
  filter(isGeneralAssignmentNode),
  groupBy(prop("name")),
  Object.values,
  filter<GeneralAssignmentNode[]>((group) => group.length > 1),
  flatten,
  (nodes) => new Set(nodes)
);

export const getAssignmentCycles = (nodes: MathNode[]) => {
  const assignmentNodes = nodes.filter(isGeneralAssignmentNode);
};
