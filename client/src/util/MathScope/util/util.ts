import * as R from "ramda";
import Graph, { Vertex } from "tarjan-graph";
import {
  FullDiff,
  ASSIGNMENT_TYPES,
  AnonMathNode,
  AnonAssignmentNode,
} from "../interfaces";

const isAssignmentNode = <
  N extends AnonMathNode,
  AN extends N & AnonAssignmentNode
>(
  node: N
): node is AN => {
  if (ASSIGNMENT_TYPES.includes(node.type)) return true;
  return false;
};

const assertIsAssignmentNode: <
  N extends AnonMathNode,
  AN extends N & AnonAssignmentNode
>(
  node: N
) => asserts node is AN = (node) => {
  if (isAssignmentNode(node)) return;
  throw new Error(`Node should be an assignment node; it is ${node.type}`);
};

const getAssignmentCycles = <N extends AnonMathNode>(
  nodes: N[]
): (AnonAssignmentNode & N)[][] => {
  const assignmentNodes = nodes.filter(isAssignmentNode);
  const graph = new Graph();
  assignmentNodes.forEach((node) => {
    graph.add(node.name, [...node.dependencies]);
  });
  const cycles = graph.getCycles();
  const byName = R.indexBy((n) => n.name, assignmentNodes);
  const toMathjsNode = (v: Vertex) => byName[v.name];
  return cycles.map(R.map(toMathjsNode));
};

const assertIsError: (err: unknown) => asserts err is Error = (err) => {
  if (err instanceof Error) return;
  throw new Error(`${err} should be an Error instance.`);
};

/**
 * Returns the intersection of input sets.
 */
const setIntersection = <T>(...sets: Set<T>[]): Set<T> => {
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
const setUnion = <T>(...sets: Set<T>[]): Set<T> => {
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
const setDifference = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  const result = new Set([...a]);
  b.forEach((item) => result.delete(item));
  return result;
};

const diff = <T, U>(x: Map<T, U>, y: Map<T, U>): FullDiff<T> => {
  const result = {
    added: new Set<T>(),
    updated: new Set<T>(),
    deleted: new Set<T>(),
    unchanged: new Set<T>(),
    touched: new Set<T>(),
  };
  x.forEach((value, key) => {
    if (y.has(key)) {
      if (value === y.get(key)) {
        result.unchanged.add(key);
      } else {
        result.updated.add(key);
        result.touched.add(key);
      }
    } else {
      result.added.add(key);
      result.touched.add(key);
    }
  });
  y.forEach((_value, key) => {
    if (!x.has(key)) {
      result.deleted.add(key);
      result.touched.add(key);
    }
  });
  return result;
};

const isNotNil = <T>(x: T): x is NonNullable<T> => {
  if (x === null || x === undefined) return false;
  return true;
};

export {
  isAssignmentNode,
  isNotNil,
  assertIsAssignmentNode,
  getAssignmentCycles,
  setDifference,
  setIntersection,
  setUnion,
  diff,
  assertIsError,
};
