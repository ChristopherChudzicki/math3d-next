import { parse as defaultParse, MathNode } from "mathjs";
import type { IParse, EvaluationScope } from "./types";

const getIdentifyingParser = (
  parse: IParse
): ((id: string, expr: string) => MathNode) => {
  const identifyingParser = (id: string, expr: string) => {
    const node = parse(expr);
    node.comment = id;
    return node;
  };
  return identifyingParser;
};

/**
 * Very draft... Other classes in this directory are more developed.
 * This class will be the API used by main app.
 * Should emit events and stuff. TODO: spec/implement this more
 */
export default class MathScope {
  evaluationScope: EvaluationScope;

  private parse: (id: string, expr: string) => MathNode;

  private nodes: Record<string, MathNode>;

  constructor(evaluationScope = {}, parse: IParse = defaultParse) {
    this.parse = getIdentifyingParser(parse);
    this.evaluationScope = evaluationScope;
    this.nodes = {};
  }

  addExpression(id: string, expr: string): void {
    if (this.nodes[id] !== undefined) {
      throw new Error(`node with id ${id} already exists.`);
    }
    this.nodes[id] = this.parse(id, expr);
  }

  updateExpression(id: string, parseable: string): void {
    if (this.nodes[id] === undefined) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    this.nodes[id] = this.parse(id, parseable);
    /**
     * When updating a constant, we will not need a new Evaluator
     */
    throw new Error("Not implemeneted");
  }

  removeExpression(id: string): void {
    if (this.nodes[id] === undefined) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    // ...
  }
}
