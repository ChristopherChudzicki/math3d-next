import { EventEmitter } from "events";

import type { ParseOptions as DefaultParseOptions } from "./adapter";
import { parse as defaultParse } from "./adapter";
import Evaluator from "./Evaluator";
import type {
  Diff,
  EvaluationChange,
  EvaluationErrors,
  EvaluationResult,
  EvaluationScope,
  MathNode,
  Parse,
  ParseErrors,
} from "./interfaces";
import { assertIsError, DiffingMap } from "./util";

export type IdentifiedExpression<
  PO extends DefaultParseOptions = DefaultParseOptions
> = {
  id: string;
  expr: string;
  parseOptions?: PO;
};

export type OnChangeListener = <
  PO extends DefaultParseOptions = DefaultParseOptions
>(
  event: ScopeChangeEvent<PO>
) => void;

interface ScopeChange {
  results: EvaluationChange["results"];
  evalErrors: EvaluationChange["errors"];
  parseErrors: Diff<string>;
}

export interface ScopeChangeEvent<
  PO extends DefaultParseOptions = DefaultParseOptions
> {
  type: "change";
  changes: ScopeChange;
  mathScope: MathScope<PO>;
}

export type OnChangeErrorsListener = <
  PO extends DefaultParseOptions = DefaultParseOptions
>(
  event: ScopeChangeErrorsEvent<PO>
) => void;

export interface ScopeChangeErrorsEvent<
  PO extends DefaultParseOptions = DefaultParseOptions
> {
  type: "change-errors";
  changes: Omit<ScopeChange, "results">;
  mathScope: MathScope<PO>;
}

/**
 * Parse and evaluate a dynamic scope of mathematical expressions, possibly
 * containing errors. Fires `change` events when the scope changes.
 */
export default class MathScope<
  PO extends DefaultParseOptions = DefaultParseOptions
> {
  initialScope: EvaluationScope;

  private events = new EventEmitter();

  private evaluator: Evaluator;

  results: EvaluationResult;

  evalErrors: EvaluationErrors;

  parseErrors: ParseErrors = new Map();

  private parse: Parse<PO>;

  constructor({
    parse = defaultParse,
    initialScope = new Map(),
  }: {
    parse?: Parse<PO>;
    initialScope?: EvaluationScope;
  } = {}) {
    this.parse = parse;
    this.initialScope = initialScope;
    this.evaluator = new Evaluator(initialScope);

    this.results = this.evaluator.results;
    this.evalErrors = this.evaluator.errors;

    this.setExpressions = this.setExpressions.bind(this);
    this.deleteExpressions = this.deleteExpressions.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
  }

  setExpressions(expressions: IdentifiedExpression<PO>[]): Diff<string> {
    const parsed: MathNode[] = [];
    const parseErrors = new DiffingMap(this.parseErrors);
    expressions.forEach(({ id, expr, parseOptions }) => {
      try {
        const node = this.parse(expr, id, parseOptions);
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
    const evalChange = this.evaluator.evaluate();
    const changes: ScopeChange = {
      results: evalChange.results,
      evalErrors: evalChange.errors,
      parseErrors: parseChange,
    };

    this.emitChangeEvent(changes);
    if (
      changes.evalErrors.touched.size > 0 ||
      changes.parseErrors.touched.size > 0
    ) {
      this.emitChangeErrorsEvent(changes);
    }

    return parseChange;
  }

  deleteExpressions(ids: string[]): Diff<string> {
    const parseErrors = new DiffingMap(this.parseErrors);
    this.evaluator.enqueueDeleteExpressions(ids);
    const evalChange = this.evaluator.evaluate();
    ids.forEach((id) => parseErrors.delete(id));

    const parseChange = parseErrors.getDiff();
    const changes: ScopeChange = {
      results: evalChange.results,
      evalErrors: evalChange.errors,
      parseErrors: parseChange,
    };
    this.emitChangeEvent(changes);
    if (
      changes.evalErrors.touched.size > 0 ||
      changes.parseErrors.touched.size > 0
    ) {
      this.emitChangeErrorsEvent(changes);
    }

    return parseChange;
  }

  private emitChangeEvent(changes: ScopeChange) {
    const event: ScopeChangeEvent<PO> = {
      type: "change",
      changes,
      mathScope: this,
    };

    this.events.emit("change", event);
  }

  private emitChangeErrorsEvent(fullChanges: ScopeChange) {
    const changes = {
      parseErrors: fullChanges.parseErrors,
      evalErrors: fullChanges.evalErrors,
    };
    const event: ScopeChangeErrorsEvent<PO> = {
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
