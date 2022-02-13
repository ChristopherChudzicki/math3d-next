import { MathNode, EvalFunction } from "mathjs";
import type ExpressionGraphManager from "./ExpressionGraphManager";
import type {
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  GeneralAssignmentNode,
} from "./types";
import { Diff } from "./types";
import { assertIsError } from "./util";

const getId = (node: MathNode) => node.comment;

class EvaluationError extends Error {}

class CyclicAssignmentError extends EvaluationError {
  constructor(cycle: GeneralAssignmentNode[]) {
    const nodeNames = cycle.map((n) => n.name);
    const message = `Cyclic dependencies: ${nodeNames}`;
    super(message);
  }
}

class DuplicateAssignmentError extends EvaluationError {
  constructor(node: GeneralAssignmentNode) {
    const message = `Name ${node.name} has been assigned multiple times.`;
    super(message);
  }
}

export default class Evaluator {
  graphManager: ExpressionGraphManager;

  compiled = new WeakMap<MathNode, EvalFunction>();

  results: EvaluationResult = new Map();

  scope: EvaluationScope = new Map();

  errors: EvaluationErrors = new Map();

  constructor(expressionGraphManager: ExpressionGraphManager) {
    this.graphManager = expressionGraphManager;
  }

  private compile(node: MathNode) {
    const cachedValue = this.compiled.get(node);
    if (cachedValue) return cachedValue;
    const compiled = node.compile();
    this.compiled.set(node, compiled);
    return compiled;
  }

  private setCycleErrors(cycles: GeneralAssignmentNode[][]): void {
    const cycleErrors = new Map(
      cycles.flatMap((cycle) =>
        cycle.map((node) => [getId(node), new CyclicAssignmentError(cycle)])
      )
    );

    this.errors.forEach((error, key) => {
      if (!(error instanceof CyclicAssignmentError)) return;
      const newError = cycleErrors.get(key);
      if (newError === undefined) {
        this.errors.delete(key);
        return;
      }
      if (newError.message === error.message) return;
      this.errors.set(key, newError);
    });

    cycleErrors.forEach((error, key) => {
      const existingError = this.errors.get(key);
      if (!existingError || !(existingError instanceof CyclicAssignmentError)) {
        this.errors.set(key, error);
      }
    });
  }

  private setDuplicateErrors(duplicates: Set<GeneralAssignmentNode>): void {
    const duplicateIds = new Set(Array.from(duplicates).map(getId));
    this.errors.forEach((error, key) => {
      if (!(error instanceof DuplicateAssignmentError)) return;
      if (duplicateIds.has(key)) return;
      this.errors.delete(key);
    });
    duplicates.forEach((node) => {
      const key = getId(node);
      const existingErr = this.errors.get(key);
      if (!existingErr || !(existingErr instanceof DuplicateAssignmentError)) {
        this.errors.set(key, new DuplicateAssignmentError(node));
      }
    });
  }

  evaluate(sources?: MathNode[]): {
    results: Diff<string>;
    errors: Diff<string>;
  } {
    const { order, cycles, duplicates } =
      this.graphManager.getEvaluationOrder(sources);

    const prevResults = new Map(this.results);
    const prevErrors = new Map(this.errors);

    order.forEach((node) => {
      const { evaluate } = this.compile(node);
      const exprId = getId(node);
      try {
        const evaluated = evaluate(this.scope);
        this.results.set(exprId, evaluated);
        this.errors.delete(exprId);
      } catch (err) {
        assertIsError(err);
        this.results.delete(exprId);
        this.errors.set(exprId, err);
      }
    });

    this.setCycleErrors(cycles);
    this.setDuplicateErrors(duplicates);

    this.scope = new Map(this.scope);

    return { results: {} as Diff<string>, errors: {} as Diff<string> };
  }
}
