import * as R from "ramda";
import { MathNode, AssignmentNode, EvalFunction } from "mathjs";
import toposort from "toposort";
import type {
  EvaluationScope,
  EvaluationResult,
  EvaluationErrors,
  GeneralAssignmentNode,
} from "./types";
import { isGeneralAssignmentNode, getDependencies } from "./util";
import DirectedGraph, { DirectedEdge } from "./DirectedGraph";

const validateNodeIds = (nodes: MathNode[]) => {
  const nodeIds = new Set(nodes.map((node) => node.comment));
  if (nodeIds.has("") || nodeIds.size !== nodes.length) {
    throw new Error(
      "Every root node should have a unique, non-empty comment serving as its id."
    );
  }
};

const getAssignmentNodesByName = R.pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  { [name: string]: GeneralAssignmentNode }
>(R.filter(isGeneralAssignmentNode), R.indexBy(R.prop("name")));

export const getDependencyGraph = (nodes: MathNode[]) => {
  const assignments = getAssignmentNodesByName(nodes);
  const dependencyEdges: DirectedEdge<MathNode>[] = nodes.flatMap(
    (dependent) => {
      const dependencies = getDependencies(dependent);
      return [...dependencies]
        .map((dependencyName) => assignments[dependencyName])
        .filter((dependency) => dependency)
        .map((dependency) => ({ from: dependency, to: dependent }));
    }
  );
  return new DirectedGraph(dependencyEdges);
};

const getId = (node: MathNode) => node.comment;

type UpdateResults = {
  resultUpdates: Set<string>;
  errorUpdates: Set<string>;
};
export default class Evaluator {
  result: EvaluationResult = new Map();

  errors: EvaluationErrors = new Map();

  private scope: EvaluationScope;

  private nodes: { [id: string]: MathNode };

  private compiled: { [id: string]: EvalFunction };

  private dependencyGraph: DirectedGraph<MathNode>;

  private evaluationOrder: string[];

  private evaluationOrders: Map<string, string[]>;

  constructor(nodes: MathNode[], initialScope: EvaluationScope = new Map()) {
    validateNodeIds(nodes);
    this.nodes = Object.fromEntries(
      Array.from(nodes).map((node) => [getId(node), node])
    );
    this.scope = new Map(initialScope);
    this.dependencyGraph = getDependencyGraph(nodes);
    this.evaluationOrder = this.getEvaluationOrder();

    this.compiled = R.mapObjIndexed((node) => node.compile(), this.nodes);

    this.evaluationOrders = new Map();
    this.evaluate(this.evaluationOrder);
  }

  private getEvaluationOrder(sources?: MathNode[]): string[] {
    const graph =
      sources === undefined
        ? this.dependencyGraph
        : this.dependencyGraph.getReachableSubgraph(sources);
    const edges = graph.getEdges();

    return toposort(edges.map((e) => [e.from, e.to])).map(getId);
  }

  updateLiteralConstant(nodeId: string, value: number): UpdateResults {
    const node = this.nodes[nodeId];
    if (!(node instanceof AssignmentNode)) {
      throw new Error(`Expected node ${nodeId} to be an assignment node`);
    }
    this.compiled[nodeId] = { evaluate: () => value };
    this.result.set(nodeId, value);
    this.scope.set(node.name, value);
    const updated = this.reevaluateDescendants(nodeId);
    updated.resultUpdates.add(nodeId);
    return updated;
  }

  private evaluate(evaluationOrder: string[]): UpdateResults {
    const resultUpdates = new Set<string>();
    const errorUpdates = new Set<string>();

    evaluationOrder.forEach((exprId) => {
      const { evaluate } = this.compiled[exprId];
      try {
        const result = evaluate(this.scope);
        this.result.set(exprId, result);
        this.errors.delete(exprId);
        resultUpdates.add(exprId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.errors.set(exprId, error);
      }
    });
    return { resultUpdates, errorUpdates };
  }

  private reevaluateDescendants(nodeId: string): UpdateResults {
    const node = this.nodes[nodeId];
    const evaluationOrder =
      this.evaluationOrders.get(nodeId) ?? this.getEvaluationOrder([node]);
    if (!this.evaluationOrders.has(nodeId)) {
      this.evaluationOrders.set(nodeId, evaluationOrder);
    }
    return this.evaluate(evaluationOrder);
  }
}
