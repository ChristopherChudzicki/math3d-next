import ExpressionGraphManager from "./ExpressionGraphManager";
import {
  Diff,
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  EvaluationChange,
  AssignmentNode,
  MathNode,
  Evaluatable,
  MathNodeType,
} from "./interfaces";
import {
  assertIsError,
  isAssignmentNode,
  setDifference,
  setUnion,
  DiffingMap,
  isNotNil,
} from "./util";

class EvaluationError extends Error {}

interface EvaluatorAction {
  type: "delete" | "add";
  nodes: MathNode[];
}

export class UnmetDependencyError extends EvaluationError {
  constructor(unmetDependencyNames: string[]) {
    const sorted = [...unmetDependencyNames].sort();
    const message = `Undefined symbol(s): ${sorted}`;
    super(message);
  }
}

export class AssignmentError extends EvaluationError {}
export class CyclicAssignmentError extends AssignmentError {
  constructor(cycle: AssignmentNode[]) {
    const nodeNames = cycle.map((n) => `'${n.name}'`).join(", ");
    const message = `Cyclic dependencies: ${nodeNames}`;
    super(message);
  }
}

export class DuplicateAssignmentError extends AssignmentError {
  constructor(node: AssignmentNode) {
    const message = `Name ${node.name} has been assigned multiple times.`;
    super(message);
  }
}

const makeAssignmentError = (node: AssignmentNode, cycle: AssignmentNode[]) => {
  const isDuplicate = cycle.some((c) => c.name === node.name && c !== node);
  if (isDuplicate) return new DuplicateAssignmentError(node);
  return new CyclicAssignmentError(cycle);
};

const getUnmetDependencies = (
  node: MathNode,
  scope: EvaluationScope
): string[] => {
  const unmet = [...node.dependencies].filter((dep) => !scope.has(dep));
  return unmet;
};

/**
 * Evaluates a collection of mathematical expressions.
 *
 * For example:
 * ```ts
 * // node implements (id: string, expr: string) => MathNode
 * const a = node("id-a", "a = 2");
 * const b = node("id-b", "b = a^2");
 * const expr1 = node("id-expr1", "a + b");
 * const expr2 = node("id-expr2", "b + c");
 * const evaluator = new Evaluator();
 * evaluator.enqueueAddExpressions([a, b, expr1, expr2]);
 * evaluator.evaluate();
 * console.log(evaluator.results)
 * // Map(3) { 'id-a' => 3, 'id-b' => 9, 'id-expr1' => 12 }
 * console.log(evaluator.errors)
 * // Map(1) { 'id-expr2' => UnmetDependencyError: Undefined symbol(s): c }
 * ```
 *
 * Calling `evaluator.evaluate()` applies any enqueued changes and returns a
 * diff of the changes.
 */
export default class Evaluator {
  compiled = new WeakMap<MathNode, Evaluatable>();

  results: EvaluationResult = new Map();

  scope: EvaluationScope;

  errors: EvaluationErrors = new Map();

  private validators = new Map<string, (x: unknown) => void>();

  private nodesById: Map<string, MathNode> = new Map();

  private changeQueue: EvaluatorAction[] = [];

  private graphManager = new ExpressionGraphManager<MathNode>();

  constructor(initialScope: EvaluationScope = new Map()) {
    this.scope = new Map(initialScope);
  }

  private compile(node: MathNode) {
    const cachedValue = this.compiled.get(node);
    if (cachedValue) return cachedValue;
    const compiled = node.compile();
    this.compiled.set(node, compiled);
    return compiled;
  }

  private updateAssignmentErrors(
    errors: DiffingMap<string, Error>,
    cycles: AssignmentNode[][]
  ): void {
    const currentErrors = new Map(
      cycles.flatMap((cycle) =>
        cycle.map((node) => [node.id, makeAssignmentError(node, cycle)])
      )
    );
    currentErrors.forEach((error, key) => {
      const existingError = this.errors.get(key);
      if (!existingError || !(existingError instanceof AssignmentError)) {
        errors.set(key, error);
      }
    });
  }

  enqueueAddExpressions(nodes: MathNode[]): void {
    nodes.forEach((node) => {
      const { id } = node;
      if (this.nodesById.has(id)) {
        throw new Error(`node id "${id}" is already in use.`);
      }
      this.nodesById.set(id, node);
    });
    const action: EvaluatorAction = {
      type: "add",
      nodes,
    };
    this.changeQueue.push(action);
  }

  enqueueDeleteExpressions(ids: string[]): void {
    const nodes: MathNode[] = ids
      .map((id) => this.nodesById.get(id))
      .filter(isNotNil);
    ids.forEach((id) => {
      this.nodesById.delete(id);
      this.validators.delete(id);
    });
    const action: EvaluatorAction = { type: "delete", nodes };
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
    return {
      added,
      deleted,
      updated: new Set(),
      touched: setUnion(added, deleted),
    };
  }

  /**
   * Updates `results` and `errors` properties with enqueued changes to the
   * expression graph.
   * - Only re-evaluates the affected subgraph.
   * - Returns a diff indicating changes.
   * - runs in O(|affectedSubgraph|)
   */
  evaluate(): EvaluationChange {
    const results = new DiffingMap(this.results);
    const errors = new DiffingMap(this.errors);

    const willDelete = this.changeQueue
      .filter((a) => a.type === "delete")
      .flatMap((a) => a.nodes);
    const affectedByDelete =
      this.graphManager.graph.getReachableSubgraph(willDelete);
    const nodesAffectedByDelete = affectedByDelete.getNodes();
    nodesAffectedByDelete.forEach((node) => {
      results.delete(node.id);
      errors.delete(node.id);
      if (isAssignmentNode(node)) {
        this.scope.delete(node.name);
      }
    });

    const changes = this.applyChanges();

    const affected = setUnion(
      setDifference(nodesAffectedByDelete, changes.deleted),
      changes.added
    );
    const { order, cycles } = this.graphManager.getEvaluationOrder(affected);

    this.updateAssignmentErrors(errors, cycles);

    cycles.flat().forEach((node) => {
      const exprId = node.id;
      results.delete(exprId);
      this.scope.delete(node.name);
    });

    order.forEach((node) => {
      const { evaluate } = this.compile(node);
      const exprId = node.id;
      try {
        if (node.type === MathNodeType.FunctionAssignmentNode) {
          const unmet = getUnmetDependencies(node, this.scope);
          if (unmet.length > 0) {
            throw new UnmetDependencyError(unmet);
          }
        }
        const evaluated = evaluate(this.scope);
        const validate = this.validators.get(exprId);
        if (validate) validate(evaluated);
        results.set(exprId, evaluated);
        errors.delete(exprId);
      } catch (rawError) {
        assertIsError(rawError);
        const unmet = getUnmetDependencies(node, this.scope);
        const error =
          unmet.length > 0 ? new UnmetDependencyError(unmet) : rawError;
        results.delete(exprId);
        if (isAssignmentNode(node)) {
          this.scope.delete(node.name);
        }
        errors.set(exprId, error);
      }
    });

    return {
      results: results.getDiff(),
      errors: errors.getDiff(),
    };
  }
}
