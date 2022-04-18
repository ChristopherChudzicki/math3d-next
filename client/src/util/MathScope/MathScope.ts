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

type IdentifiedExpression = {
  id: string;
  expression: string;
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
 *
 * This API should be focused around
 *  - adding/removing nodes with strings, parsed by the parser
 *  - subscribing to events
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
    this.evaluator = new Evaluator(initialScope);
  }
}
