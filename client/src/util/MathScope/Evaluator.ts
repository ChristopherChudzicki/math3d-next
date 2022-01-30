import * as R from "ramda";
import { MathNode, AssignmentNode, ConstantNode, EvalFunction } from "mathjs";
import toposort from "toposort";
import type { EvaluationScope, GeneralAssignmentNode } from "./types";
import { isGeneralAssignmentNode, getDependencies } from "./util";
import DirectedGraph, { DirectedEdge } from "./DirectedGraph";

type Results = {
  [id: string]: unknown;
};

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
      return [...dependencies].map((dependencyName) => {
        const dependency = assignments[dependencyName];
        return { from: dependency, to: dependent };
      });
    }
  );
  return new DirectedGraph(dependencyEdges);
};

const getId = (node: MathNode) => node.comment;

export default class Evaluator {
  results: Results = {};

  private scope: EvaluationScope;

  private nodes: { [id: string]: MathNode };

  private compiled: { [id: string]: EvalFunction };

  private dependencyGraph: DirectedGraph<MathNode>;

  private evaluationOrder: string[];

  private evaluationOrders: Map<string, string[]>;

  constructor(nodes: MathNode[], initialScope: EvaluationScope = {}) {
    validateNodeIds(nodes);
    this.nodes = Object.fromEntries(nodes.map((node) => [getId(node), node]));
    this.scope = { ...initialScope };
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

  updateLiteralConstant(nodeId: string, value: number): void {
    const node = this.nodes[nodeId];
    if (!(node instanceof AssignmentNode)) {
      throw new Error(`Expected node ${nodeId} to be an assignment node`);
    }
    this.compiled[nodeId] = { evaluate: () => value };
    this.results[nodeId] = value;
    this.reevaluateDescendants(nodeId);
  }

  private evaluate(evaluationOrder: string[]): void {
    evaluationOrder.forEach((exprId) => {
      const { evaluate } = this.compiled[exprId];
      const result = evaluate(this.scope);
      this.results[exprId] = result;
    });
  }

  private reevaluateDescendants(nodeId: string): void {
    const node = this.nodes[nodeId];
    const evaluationOrder =
      this.evaluationOrders.get(nodeId) ?? this.getEvaluationOrder([node]);
    if (!this.evaluationOrders.has(nodeId)) {
      this.evaluationOrders.set(nodeId, evaluationOrder);
    }
    this.evaluate(evaluationOrder);
  }

  /**
   * TODO: Handle EvaluationErrors. Probably just store them in the results array
   */
}
