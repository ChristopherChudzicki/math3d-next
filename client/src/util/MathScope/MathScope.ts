import { EventEmitter } from "events";
import { parse as defaultParse, MathNode } from "mathjs";
import Evaluator from "./Evaluator";
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
  initialScope: EvaluationScope;

  eventEmitter = new EventEmitter();

  private evaluator: Evaluator;

  private parse: (id: string, expr: string) => MathNode;

  private nodes: Map<string, MathNode> = new Map();

  constructor({
    parse = defaultParse,
    initialScope = new Map(),
  }: {
    parse?: IParse;
    initialScope?: EvaluationScope;
  } = {}) {
    this.parse = getIdentifyingParser(parse);
    this.initialScope = initialScope;
    this.evaluator = new Evaluator([], initialScope);
  }

  private reevaluateAll() {
    const nodes = Array.from(this.nodes.values());
    this.evaluator = new Evaluator(nodes, this.initialScope);
  }

  addExpression(id: string, expr: string): void {
    if (this.nodes.has(id)) {
      throw new Error(`node with id ${id} already exists.`);
    }
    this.nodes.set(id, this.parse(id, expr));
    this.reevaluateAll();
  }

  updateExpression(id: string, expr: string): void {
    if (!this.nodes.has(id)) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    this.nodes.set(id, this.parse(id, expr));
    this.reevaluateAll();
    /**
     * When updating a constant, we will not need a new Evaluator
     */
    throw new Error("Not implemeneted");
  }

  removeExpression(id: string): void {
    if (!this.nodes.has(id)) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    this.nodes.delete(id);
    // ...
  }
}
