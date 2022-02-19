import {
  MathNode,
  EvalFunction,
  isMatrix,
  FunctionAssignmentNode,
} from "mathjs";
import ExpressionGraphManager from "./ExpressionGraphManager";
import type {
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  GeneralAssignmentNode,
} from "./types";
import { Diff } from "./types";
import { assertIsError, diff, getDependencies } from "./util";

const getId = (node: MathNode) => node.comment;

class EvaluationError extends Error {}

export class UnmetDependencyError extends EvaluationError {
  constructor(unmetDependencyNames: string[]) {
    const sorted = [...unmetDependencyNames].sort();
    const message = `Undefined symbol(s): ${sorted}`;
    super(message);
  }
}

export class AssignmentError extends EvaluationError {}
export class CyclicAssignmentError extends AssignmentError {
  constructor(cycle: GeneralAssignmentNode[]) {
    const nodeNames = cycle.map((n) => n.name);
    const message = `Cyclic dependencies: ${nodeNames}`;
    super(message);
  }
}

export class DuplicateAssignmentError extends AssignmentError {
  constructor(node: GeneralAssignmentNode) {
    const message = `Name ${node.name} has been assigned multiple times.`;
    super(message);
  }
}

const makeAssignmentError = (
  node: GeneralAssignmentNode,
  cycle: GeneralAssignmentNode[],
  isDuplicate: boolean
) => {
  if (isDuplicate) return new DuplicateAssignmentError(node);
  return new CyclicAssignmentError(cycle);
};

const compile = (node: MathNode): EvalFunction => {
  const { evaluate: rawEvaluate } = node.compile();
  const evaluate = (scope: EvaluationScope) => {
    const result = rawEvaluate(scope);
    if (isMatrix(result)) {
      return result.toArray();
    }
    if (typeof result === "function") {
      const f = (...args: unknown[]) => {
        const evaluated = result(...args);
        return isMatrix(evaluated) ? evaluated.toArray() : evaluated;
      };
      return f;
    }
    return result;
  };
  return { evaluate };
};

const getUnmetDependencies = (
  node: MathNode,
  scope: EvaluationScope
): string[] => {
  const dependencies = getDependencies(node);
  const unmet = [...dependencies].filter((dep) => !scope.has(dep));
  return unmet;
};

export default class Evaluator {
  compiled = new WeakMap<MathNode, EvalFunction>();

  results: EvaluationResult = new Map();

  scope: EvaluationScope;

  errors: EvaluationErrors = new Map();

  graphManager = new ExpressionGraphManager();

  constructor(initialScope: EvaluationScope = new Map()) {
    this.scope = new Map(initialScope);
  }

  private compile(node: MathNode) {
    const cachedValue = this.compiled.get(node);
    if (cachedValue) return cachedValue;
    const compiled = compile(node);
    this.compiled.set(node, compiled);
    return compiled;
  }

  private updateAssignmentErrors(cycles: GeneralAssignmentNode[][]): void {
    const duplicates = this.graphManager.getDuplicateAssignmentNodes();
    const currentErrors = new Map(
      cycles.flatMap((cycle) =>
        cycle.map((node) => [
          getId(node),
          makeAssignmentError(node, cycle, duplicates.has(node)),
        ])
      )
    );

    this.errors.forEach((existing, key) => {
      if (!(existing instanceof AssignmentError)) return;
      const current = currentErrors.get(key);
      if (current === undefined) {
        this.errors.delete(key);
        return;
      }
      if (current.message === existing.message) return;
      this.errors.set(key, current);
    });

    currentErrors.forEach((error, key) => {
      const existingError = this.errors.get(key);
      if (!existingError || !(existingError instanceof AssignmentError)) {
        this.errors.set(key, error);
      }
    });
  }

  /**
   * Evaluates some or all of the expression graph.
   *
   * When called with no arguments, re-evaluates the entire expression graph.
   * When called with `sources`, re-evalautes the subgraph reachable from those
   * sources.
   *
   * Returns a diff indicating results and errors that have changed.
   */
  evaluate(sources?: MathNode[]): {
    results: Diff<string>;
    errors: Diff<string>;
  } {
    const { order, cycles } = this.graphManager.getEvaluationOrder(sources);

    const oldResults = new Map(this.results);
    const oldErrors = new Map(this.errors);

    order.forEach((node) => {
      const { evaluate } = this.compile(node);
      const exprId = getId(node);
      try {
        const evaluated = evaluate(this.scope);
        this.results.set(exprId, evaluated);
        this.errors.delete(exprId);
        if (node instanceof FunctionAssignmentNode) {
          const unmet = getUnmetDependencies(node, this.scope);
          if (unmet.length > 0) {
            throw new UnmetDependencyError(unmet);
          }
        }
      } catch (rawError) {
        assertIsError(rawError);
        const unmet = getUnmetDependencies(node, this.scope);
        const error =
          unmet.length > 0 ? new UnmetDependencyError(unmet) : rawError;
        this.results.delete(exprId);
        this.errors.set(exprId, error);
      }
    });

    // The cycles include duplicates
    this.updateAssignmentErrors(cycles);

    this.scope = new Map(this.scope);

    return {
      results: diff(this.results, oldResults),
      errors: diff(this.errors, oldErrors),
    };
  }
}
