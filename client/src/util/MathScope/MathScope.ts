import { EventEmitter } from "events";

import type { ParseOptions as DefaultParseOptions } from "./adapter";
import { parse as defaultParse } from "./adapter";
import Evaluator from "./Evaluator";
import type {
  Diff,
  EvaluationChange,
  EvaluationResult,
  EvaluationScope,
  MathNode,
  Parse,
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
  results: Diff<string>;
  errors: Diff<string>;
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

  errors = new Map<string, Error>();

  evalScope: EvaluationScope;

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

    this.evalScope = this.evaluator.scope;

    this.setExpressions = this.setExpressions.bind(this);
    this.deleteExpressions = this.deleteExpressions.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
  }

  private syncEvalErrors(
    evalChange: EvaluationChange,
    diff: DiffingMap<string, Error>
  ) {
    evalChange.errors.added.forEach((id) => {
      const err = this.evaluator.errors.get(id);
      assertIsError(err);
      diff.set(id, err);
    });
    evalChange.errors.updated.forEach((id) => {
      const err = this.evaluator.errors.get(id);
      assertIsError(err);
      diff.set(id, err);
    });
    evalChange.errors.deleted.forEach((id) => {
      diff.delete(id);
    });
  }

  setExpressions(expressions: IdentifiedExpression<PO>[]): void {
    const parsed: MathNode[] = [];
    const errors = new DiffingMap(this.errors);
    const parseErrors = new Map<string, Error>();
    expressions.forEach(({ id, expr, parseOptions }) => {
      try {
        const node = this.parse(expr, id, parseOptions);
        parsed.push(node);
        // delete the old error:
        // if it was a parse error, it has now parsed fine.
        // if it was an eval error, it is about to be re-evaluated
        errors.delete(id);
      } catch (error) {
        assertIsError(error);
        parseErrors.set(id, error);
      }
    });

    const ids = expressions.map((e) => e.id);
    this.evaluator.enqueueDeleteExpressions(ids);
    this.evaluator.enqueueAddExpressions(parsed);

    const evalChange = this.evaluator.evaluate();

    this.syncEvalErrors(evalChange, errors);
    parseErrors.forEach((err, id) => {
      errors.set(id, err);
    });
    const errorsChange = errors.getDiff();

    const changes: ScopeChange = {
      results: evalChange.results,
      errors: errorsChange,
    };

    this.emitChangeEvent(changes);
    if (changes.errors.touched.size > 0) {
      this.emitChangeErrorsEvent(changes);
    }
  }

  deleteExpressions(ids: string[]): void {
    const errors = new DiffingMap(this.errors);
    this.evaluator.enqueueDeleteExpressions(ids);
    const evalChange = this.evaluator.evaluate();
    ids.forEach((id) => errors.delete(id));
    this.syncEvalErrors(evalChange, errors);

    const errorsChange = errors.getDiff();
    const changes: ScopeChange = {
      results: evalChange.results,
      errors: errorsChange,
    };
    this.emitChangeEvent(changes);
    if (changes.errors.touched.size > 0) {
      this.emitChangeErrorsEvent(changes);
    }
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
      errors: fullChanges.errors,
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
