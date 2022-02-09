import * as R from "ramda";
import { MathNode } from "mathjs";
import toposort from "toposort";
import type { GeneralAssignmentNode } from "./types";
import { isGeneralAssignmentNode, getDependencies } from "./util";
import DirectedGraph from "./DirectedGraph";

const getAssignmentNodesByName = R.pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  { [name: string]: GeneralAssignmentNode[] }
>(R.filter(isGeneralAssignmentNode), R.groupBy(R.prop("name")));

export default class ExpressionGraph {
  graph = new DirectedGraph<MathNode>([], []);

  dependents = new Map<string, Set<MathNode>>();

  constructor(nodes: MathNode[] = []) {
    this.addExpressions(nodes);
  }

  addExpressions(nodes: MathNode[]): void {
    nodes.forEach((node) => {
      this.graph.addNode(node);
    });
    const assignments = getAssignmentNodesByName(
      Array.from(this.graph.getNodes())
    );
    nodes.forEach((node) => {
      /**
       * Get dependencies of this node.
       * For example, f(x) = a*x + b + pi has dependencies "a" and "b".
       * The nodes defining the dependencies ("a = 2", etc)
       *    - might not have been added yet
       *    - might have been added multiple times ("a = 2" AND "a = 3" concurrently)
       * In both cases we will not be able to evaluate this node, but we can
       * still construct the dependency graph.
       */

      // construct edges FROM dependencies to this node
      const dependencyNames = getDependencies(node);
      dependencyNames.forEach((dependencyName) => {
        const dependencies = assignments[dependencyName] ?? [];
        dependencies.forEach((dependency) => {
          this.graph.addEdge(dependency, node);
        });
      });

      this.registerDependencies(node);
      // construct edges from this node TO its dependents
      if (isGeneralAssignmentNode(node)) {
        const { name } = node;
        const dependents = this.dependents.get(name);
        if (dependents === undefined) return;
        dependents.forEach((dependent) => {
          this.graph.addEdge(node, dependent);
        });
      }
    });
  }

  private registerDependencies(node: MathNode): void {
    const dependencyNames = getDependencies(node);
    dependencyNames.forEach((dependencyName) => {
      const dependents =
        this.dependents.get(dependencyName) ?? new Set<MathNode>();
      dependents.add(node);
      this.dependents.set(dependencyName, dependents);
    });
  }

  private unregisterDependencies(node: MathNode): void {
    const dependencyNames = getDependencies(node);
    dependencyNames.forEach((dependencyName) => {
      const dependents = this.dependents.get(dependencyName);
      if (!dependents) return;
      dependents.delete(node);
      if (dependents.size === 0) {
        this.dependents.delete(dependencyName);
      } else {
        this.dependents.set(dependencyName, dependents);
      }
    });
  }

  deleteExpressions(nodes: MathNode[]): void {
    nodes.forEach((node) => {
      this.graph.deleteNode(node);
      this.unregisterDependencies(node);
    });
  }

  getEvaluationOrder(sources?: MathNode[]): {
    order: MathNode[];
    cycleNodes: Set<MathNode>;
    duplicateAssignmentNodes: Set<MathNode>;
  } {
    const graph =
      sources === undefined
        ? this.graph
        : this.graph.getReachableSubgraph(sources);

    const edges = graph.getEdges();
    const isolated = Array.from(graph.getIsolatedNodes());
    const cycleNodes = new Set(graph.getCycles().flat());

    const acyclicEdges = edges.filter(
      (e) => !cycleNodes.has(e.from) && !cycleNodes.has(e.to)
    );

    const order = toposort(acyclicEdges.map((e) => [e.from, e.to])).concat(
      isolated
    );

    return { order, cycleNodes, duplicateAssignmentNodes: new Set() };
  }
}
