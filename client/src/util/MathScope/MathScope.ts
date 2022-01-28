import { parse, MathNode } from "mathjs";
import type { IParse } from "./types";

/**
 * A directed graph of all
 *  1. assignment nodes that
 *    - have unique names
 *    - do not have cyclic dependencies
 *  2. and non-assignment nodes
 */
class ExpressionDependencyGraph {
  constructor(nodes) {}

  static findCycles(nodes: MathNode[]): MathNode[][] {
    return [];
  }
}
export default class MathScope {
  defaultContext: Record<string, unknown>;

  dependencyGraph: unknown;

  private parse: IParse;

  private nodesById: Record<string, MathNode>;

  private idsByNode: Map<MathNode, string>;

  constructor(defaultContext = {}, parser: IParse = parse) {
    this.parse = parse;
    this.defaultContext = defaultContext;
  }

  addExpression(id: string, parseable: string): void {
    if (this.nodesById[id] !== undefined) {
      throw new Error(`node with id ${id} already exists.`);
    }
    const node = this.parse(parseable);
    this.nodesById[id] = node;
  }

  updateExpression(id: string, parseable: string): void {
    if (this.nodesById[id] === undefined) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    // When updating a constant node, we will not need to re-sort evaluation order
  }

  removeExpression(id: string, parseable: string): void {
    if (this.nodes[id] === undefined) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    // When updating a constant node, we will not need to re-sort evaluation order
  }
}
