import { parse, MathNode } from "mathjs";
import type { IParse } from "./types";
export default class MathScope {
  nodes: Record<string, MathNode> = {};

  defaultContext: Record<string, unknown>;

  /**
   * A directed graph of all nodes that:
   * - have dependencies met
   * - do NOT have cyclies
   * - have unique names (if assignment nodes)
   */
  dependencyGraph: unknown;

  private parse: IParse;

  constructor(defaultContext = {}, parser: IParse = parse) {
    this.parse = parse;
    this.defaultContext = defaultContext;
  }

  addExpression(id: string, parseable: string): void {
    if (this.nodes[id] !== undefined) {
      throw new Error(`node with id ${id} already exists.`);
    }
    this.nodes[id] = this.parse(parseable);
  }

  updateExpression(id: string, parseable: string): void {
    if (this.nodes[id] === undefined) {
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
