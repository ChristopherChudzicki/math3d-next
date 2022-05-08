import { EventEmitter } from "events";
import { parse as defaultParse, MathNode } from "mathjs";
import Evaluator from "./Evaluator";
import type {
  IParse,
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  EvaluationChange,
  ParseErrors,
} from "./types";
import { assertIsError } from "./util";

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
  expr: string;
};

type OnChangeListener = (event: ScopeChangeEvent) => void;

export type ScopeChangeEvent = {
  type: "change";
  changes: EvaluationChange;
  mathScope: MathScope;
};

/**
 * Parse and evaluate a dynamic scope of mathematical expressions, possibly
 * containing errors. Fires `change` events when the scope changes.
 */
export default class MathScope {
  initialScope: EvaluationScope;

  private events = new EventEmitter();

  private evaluator: Evaluator;

  results: EvaluationResult;

  errors: EvaluationErrors;

  private parse: (id: string, expr: string) => MathNode;

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

    this.results = this.evaluator.results;
    this.errors = this.evaluator.errors;

    this.setExpressions = this.setExpressions.bind(this);
    this.deleteExpressions = this.deleteExpressions.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
  }

  setExpressions(expressions: IdentifiedExpression[]): ParseErrors {
    const unparseable: ParseErrors = new Map();
    const parsed: MathNode[] = [];
    expressions.forEach(({ id, expr }) => {
      try {
        const node = this.parse(id, expr);
        parsed.push(node);
      } catch (error) {
        assertIsError(error);
        unparseable.set(id, error);
      }
    });

    const ids = expressions.map((e) => e.id);
    this.evaluator.enqueueDeleteExpressions(ids);
    this.evaluator.enqueueAddExpressions(parsed);

    const result = this.evaluator.evaluate();
    const event: ScopeChangeEvent = {
      type: "change",
      changes: result,
      mathScope: this,
    };

    this.events.emit("change", event);

    return unparseable;
  }

  deleteExpressions(ids: string[]): void {
    this.evaluator.enqueueDeleteExpressions(ids);
    const result = this.evaluator.evaluate();
    const event: ScopeChangeEvent = {
      type: "change",
      changes: result,
      mathScope: this,
    };

    this.events.emit("change", event);
  }

  addEventListener(type: "change", listener: OnChangeListener): this {
    this.events.addListener(type, listener);
    return this;
  }

  removeEventListener(type: "change", listener: OnChangeListener): this {
    this.events.removeListener(type, listener);
    return this;
  }
}
