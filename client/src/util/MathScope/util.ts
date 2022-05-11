import * as R from "ramda";
import {
  AssignmentNode,
  FunctionAssignmentNode,
  MathNode,
  SymbolNode,
} from "mathjs";
import Graph, { Vertex } from "tarjan-graph";
import type { GeneralAssignmentNode, FullDiff } from "./types";

export const isGeneralAssignmentNode = (
  node: unknown
): node is GeneralAssignmentNode => {
  if (node instanceof AssignmentNode) return true;
  if (node instanceof FunctionAssignmentNode) return true;
  return false;
};

export const assertIsGeneralAssignmentNode: (
  node: unknown
) => asserts node is GeneralAssignmentNode = (node: unknown) => {
  if (isGeneralAssignmentNode(node)) return;
  throw new Error("Node is not a GeneralAssignmentNode");
};

/**
 * Get the symbol dependencies of a given node. For example,
 * ```ts
 * getDependencies(math.parse('f(x) = a + g(x)'))
 * // Set { 'a', 'g' }
 * ```
 */
export const getDependencies = (
  node: MathNode,
  omit: Set<string> = new Set([])
): Set<string> => {
  if (node instanceof AssignmentNode) return getDependencies(node.value);
  if (node instanceof FunctionAssignmentNode) {
    return getDependencies(node.expr, new Set(node.params));
  }
  const dependencies = new Set<string>();
  node.traverse((n) => {
    if (n instanceof SymbolNode && !omit.has(n.name)) {
      dependencies.add(n.name);
    }
  });
  return dependencies;
};

export const getDuplicateAssignments = R.pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  R.Dictionary<GeneralAssignmentNode[]>,
  GeneralAssignmentNode[][],
  GeneralAssignmentNode[][],
  GeneralAssignmentNode[],
  Set<GeneralAssignmentNode>
>(
  R.filter(isGeneralAssignmentNode),
  R.groupBy(R.prop("name")),
  Object.values,
  R.filter<GeneralAssignmentNode[]>((group) => group.length > 1),
  R.flatten,
  (nodes) => new Set(nodes)
);

export const getAssignmentCycles = (
  nodes: MathNode[]
): GeneralAssignmentNode[][] => {
  const assignmentNodes = nodes.filter(isGeneralAssignmentNode);
  const graph = new Graph();
  assignmentNodes.forEach((node) => {
    const dependencies = getDependencies(node);
    graph.add(node.name, [...dependencies]);
  });
  const cycles = graph.getCycles();
  const byName = R.indexBy((n) => n.name, assignmentNodes);
  const toMathjsNode = (v: Vertex) => byName[v.name];
  return cycles.map(R.map(toMathjsNode));
};

export const assertIsError: (err: unknown) => asserts err is Error = (err) => {
  if (err instanceof Error) return;
  throw new Error(`${err} should be an Error instance.`);
};

/**
 * Returns the intersection of input sets.
 */
export const setIntersection = <T>(...sets: Set<T>[]): Set<T> => {
  const result = new Set<T>();
  if (sets.length === 0) return result;
  sets[0].forEach((item) => {
    if (sets.every((set) => set.has(item))) {
      result.add(item);
    }
  });
  return result;
};

/**
 * Returns the union of input sets.
 */
export const setUnion = <T>(...sets: Set<T>[]): Set<T> => {
  const result = new Set<T>();
  if (sets.length === 0) return result;
  sets.forEach((set) => {
    set.forEach((item) => result.add(item));
  });
  return result;
};

/**
 * Returns a - b for sets a and b.
 */
export const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  const result = new Set([...a]);
  b.forEach((item) => result.delete(item));
  return result;
};

export const diff = <T, U>(x: Map<T, U>, y: Map<T, U>): FullDiff<T> => {
  const result = {
    added: new Set<T>(),
    updated: new Set<T>(),
    deleted: new Set<T>(),
    unchanged: new Set<T>(),
  };
  x.forEach((value, key) => {
    if (y.has(key)) {
      if (value === y.get(key)) {
        result.unchanged.add(key);
      } else {
        result.updated.add(key);
      }
    } else {
      result.added.add(key);
    }
  });
  y.forEach((_value, key) => {
    if (!x.has(key)) {
      result.deleted.add(key);
    }
  });
  return result;
};
