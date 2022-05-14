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
  Diff,
} from "./types";
import { assertIsError } from "./util";
import DiffingMap from "./DiffingMap";

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

export type OnChangeListener = (event: ScopeChangeEvent) => void;

export interface ScopeChangeEvent {
  type: "change";
  changes: EvaluationChange;
  mathScope: MathScope;
}

export type OnChangeErrorsListener = (event: ScopeChangeErrorsEvent) => void;

export interface ScopeChangeErrorsEvent {
  type: "change-errors";
  changes: {
    errors: EvaluationChange["errors"];
  };
  mathScope: MathScope;
}

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

  parseErrors: ParseErrors = new Map();

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

  setExpressions(expressions: IdentifiedExpression[]): Diff<string> {
    const parsed: MathNode[] = [];
    const parseErrors = new DiffingMap(this.parseErrors);
    expressions.forEach(({ id, expr }) => {
      try {
        const node = this.parse(id, expr);
        parsed.push(node);
        parseErrors.delete(id);
      } catch (error) {
        assertIsError(error);
        parseErrors.set(id, error);
      }
    });

    const ids = expressions.map((e) => e.id);
    this.evaluator.enqueueDeleteExpressions(ids);
    this.evaluator.enqueueAddExpressions(parsed);

    const parseChange = parseErrors.getDiff();
    const changes = this.evaluator.evaluate();

    this.emitChangeEvent(changes);
    if (changes.errors.touched.size > 0) {
      this.emitChangeErrorsEvent(changes);
    }

    return parseChange;
  }

  deleteExpressions(ids: string[]): Diff<string> {
    const parseErrors = new DiffingMap(this.parseErrors);
    this.evaluator.enqueueDeleteExpressions(ids);
    const changes = this.evaluator.evaluate();
    ids.forEach((id) => parseErrors.delete(id));

    const parseChange = parseErrors.getDiff();
    this.emitChangeEvent(changes);
    if (changes.errors.touched.size > 0) {
      this.emitChangeErrorsEvent(changes);
    }

    return parseChange;
  }

  private emitChangeEvent(changes: EvaluationChange) {
    const event: ScopeChangeEvent = {
      type: "change",
      changes,
      mathScope: this,
    };

    this.events.emit("change", event);
  }

  private emitChangeErrorsEvent(fullChanges: EvaluationChange) {
    const changes = {
      errors: fullChanges.errors,
    };
    const event: ScopeChangeErrorsEvent = {
      type: "change-errors",
      changes,
      mathScope: this,
    };

    this.events.emit("change-errors", event);
  }

  addEventListener(
    type: "change-errors",
    listener: OnChangeErrorsListener
  ): this;
  addEventListener(type: "change", listener: OnChangeListener): this;

  addEventListener(
    type: "change" | "change-errors",
    listener: OnChangeListener | OnChangeErrorsListener
  ) {
    this.events.addListener(type, listener);
    return this;
  }

  removeEventListener(
    type: "change-errors",
    listener: OnChangeErrorsListener
  ): this;
  removeEventListener(type: "change", listener: OnChangeListener): this;

  removeEventListener(
    type: "change" | "change-errors",
    listener: OnChangeListener | OnChangeErrorsListener
  ): this {
    this.events.removeListener(type, listener);
    return this;
  }
}
