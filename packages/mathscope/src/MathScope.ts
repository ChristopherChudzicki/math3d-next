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

export type IdentifiedParseable<P> = {
  id: string;
  parseable: P;
};

interface ScopeChange {
  results: Diff<string>;
  errors: Diff<string>;
}

export interface ScopeChangeEvent<P> {
  type: "change";
  changes: ScopeChange;
  mathScope: MathScope<P>;
}

export interface ScopeChangeErrorsEvent<P> {
  type: "change-errors";
  changes: Omit<ScopeChange, "results">;
  mathScope: MathScope<P>;
}

export type OnChangeListener<P> = (
  event: CustomEvent<ScopeChangeEvent<P>>,
) => void;

export type OnChangeErrorsListener<P> = (
  event: CustomEvent<ScopeChangeErrorsEvent<P>>,
) => void;

/**
 * Parse and evaluate a dynamic scope of mathematical expressions, possibly
 * containing errors. Fires `change` events when the scope changes.
 */
export default class MathScope<P> {
  private events = new EventTarget();

  private evaluator: Evaluator;

  results: EvaluationResult;

  errors = new Map<string, Error>();

  evalScope: EvaluationScope;

  private parse: Parse<P>;

  constructor({
    parse,
    builtins = new Set(),
  }: {
    parse: Parse<P>;
    builtins?: Set<string>;
  }) {
    this.parse = parse;
    this.evaluator = new Evaluator(builtins);

    this.results = this.evaluator.results;

    this.evalScope = this.evaluator.scope;

    this.setExpressions = this.setExpressions.bind(this);
    this.deleteExpressions = this.deleteExpressions.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
  }

  private syncEvalErrors(
    evalChange: EvaluationChange,
    diff: DiffingMap<string, Error>,
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

  setExpressions(expressions: IdentifiedParseable<P>[]): void {
    const parsed: MathNode[] = [];
    const errors = new DiffingMap(this.errors);
    const parseErrors = new Map<string, Error>();
    expressions.forEach(({ id, parseable }) => {
      try {
        const node = this.parse(parseable);

        parsed.push({ ...node, id });
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
    const event: ScopeChangeEvent<P> = {
      type: "change",
      changes,
      mathScope: this,
    };

    this.events.dispatchEvent(new CustomEvent("change", { detail: event }));
  }

  private emitChangeErrorsEvent(fullChanges: ScopeChange) {
    const changes = {
      errors: fullChanges.errors,
    };
    const event: ScopeChangeErrorsEvent<P> = {
      type: "change-errors",
      changes,
      mathScope: this,
    };

    this.events.dispatchEvent(
      new CustomEvent("change-errors", { detail: event }),
    );
  }

  addEventListener(
    type: "change-errors",
    listener: OnChangeErrorsListener<P>,
  ): this;
  addEventListener(type: "change", listener: OnChangeListener<P>): this;

  addEventListener(
    type: "change" | "change-errors",
    listener: OnChangeListener<P> | OnChangeErrorsListener<P>,
  ) {
    this.events.addEventListener(type, listener as EventListener);
    return this;
  }

  removeEventListener(
    type: "change-errors",
    listener: OnChangeErrorsListener<P>,
  ): this;
  removeEventListener(type: "change", listener: OnChangeListener<P>): this;

  removeEventListener(
    type: "change" | "change-errors",
    listener: OnChangeListener<P> | OnChangeErrorsListener<P>,
  ): this {
    this.events.removeEventListener(type, listener as EventListener);
    return this;
  }
}
