import { EventEmitter } from "events";
import { parse as defaultParse, MathNode } from "mathjs";
import Evaluator from "./Evaluator";
import type {
  IParse,
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
} from "./types";

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

type ScopeUpdateEvent = {
  type: "update";
  result: {
    updated: Set<string>;
    values: EvaluationResult;
  };
  errors: {
    updated: Set<string>;
    values: EvaluationErrors;
  };
};

/**
 * Very draft... Other classes in this directory are more developed.
 * This class will be the API used by main app.
 * Should emit events and stuff. TODO: spec/implement this more
 */
export default class MathScope {
  initialScope: EvaluationScope;

  events = new EventEmitter();

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
    const { result, errors } = this.evaluator;
    const event: ScopeUpdateEvent = {
      type: "update",
      result: {
        values: result,
        updated: new Set(result.keys()),
      },
      errors: {
        values: errors,
        updated: new Set(errors.keys()),
      },
    };
    this.events.emit(event.type, event);
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
  }

  removeExpression(id: string): void {
    if (!this.nodes.has(id)) {
      throw new Error(`expression with id ${id} does not exist`);
    }
    this.nodes.delete(id);
    // ...
  }
}
