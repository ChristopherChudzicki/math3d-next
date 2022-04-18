import {
  MathNode,
  EvalFunction,
  isMatrix,
  FunctionAssignmentNode,
} from "mathjs";
import ExpressionGraphManager from "./ExpressionGraphManager";
import type {
  Diff,
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  GeneralAssignmentNode,
} from "./types";
import {
  assertIsError,
  getDependencies,
  isGeneralAssignmentNode,
  setDifference,
  setUnion,
} from "./util";
import DiffingMap from "./DiffingMap";

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
  cycle: GeneralAssignmentNode[]
) => {
  const isDuplicate = cycle.some((c) => c.name === node.name);
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

interface ManagerAction {
  type: "delete" | "add";
  nodes: MathNode[];
}

export default class Evaluator {
  compiled = new WeakMap<MathNode, EvalFunction>();

  results: EvaluationResult = new Map();

  scope: EvaluationScope;

  errors: EvaluationErrors = new Map();

  private changeQueue: ManagerAction[] = [];

  private graphManager = new ExpressionGraphManager();

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
    const currentErrors = new Map(
      cycles.flatMap((cycle) =>
        cycle.map((node) => [getId(node), makeAssignmentError(node, cycle)])
      )
    );

    currentErrors.forEach((error, key) => {
      const existingError = this.errors.get(key);
      if (!existingError || !(existingError instanceof AssignmentError)) {
        this.errors.set(key, error);
      }
    });
  }

  enqueueAddExpressions(nodes: MathNode[]): void {
    const action: ManagerAction = { type: "add", nodes };
    this.changeQueue.push(action);
  }

  enqueueDeleteExpressions(nodes: MathNode[]): void {
    const action: ManagerAction = { type: "delete", nodes };
    this.changeQueue.push(action);
  }

  /**
   * Apply changes in the changeQueue to the graphManager and return info about
   * the affected nodes.
   */
  private applyChanges(): Diff<MathNode> {
    const deleted = new Set<MathNode>();
    const added = new Set<MathNode>();
    this.changeQueue.forEach(({ type, nodes }) => {
      if (type === "add") {
        nodes.forEach((n) => added.add(n));
        this.graphManager.addExpressions(nodes);
      } else if (type === "delete") {
        nodes.forEach((n) => deleted.add(n));
        this.graphManager.deleteExpressions(nodes);
      }
    });
    this.changeQueue = [];
    return { added, deleted, updated: new Set() };
  }

  /**
   * Updates the results/errors sets with enqueued changes.
   *
   * This is O(|affectedSubgraph|)
   */
  evaluate(): {
    results: Diff<string>;
    errors: Diff<string>;
  } {
    const results = new DiffingMap(this.results);
    const errors = new DiffingMap(this.errors);

    const willDelete = this.changeQueue
      .filter((a) => a.type === "delete")
      .flatMap((a) => a.nodes);
    const affectedByDelete =
      this.graphManager.graph.getReachableSubgraph(willDelete);
    const nodesAffectedByDelete = affectedByDelete.getNodes();
    nodesAffectedByDelete.forEach((node) => {
      results.delete(getId(node));
      errors.delete(getId(node));
      if (isGeneralAssignmentNode(node)) {
        this.scope.delete(node.name);
      }
    });

    const changes = this.applyChanges();

    const affected = setUnion(
      setDifference(nodesAffectedByDelete, changes.deleted),
      changes.added
    );
    const { order, cycles } = this.graphManager.getEvaluationOrder(affected);

    order.forEach((node) => {
      const { evaluate } = this.compile(node);
      const exprId = getId(node);
      try {
        const evaluated = evaluate(this.scope);
        results.set(exprId, evaluated);
        errors.delete(exprId);
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
        results.delete(exprId);
        errors.set(exprId, error);
      }
    });

    this.updateAssignmentErrors(cycles);

    return {
      results: results.getDiff(),
      errors: errors.getDiff(),
    };
  }
}
