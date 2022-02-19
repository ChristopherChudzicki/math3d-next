import * as R from "ramda";
import { MathNode } from "mathjs";
import toposort from "toposort";
import type { GeneralAssignmentNode } from "./types";
import { isGeneralAssignmentNode, getDependencies } from "./util";
import DirectedGraph from "./DirectedGraph";

const getAssignmentNodesByName = R.pipe<
  [MathNode[]],
  GeneralAssignmentNode[],
  { [name: string]: GeneralAssignmentNode[] },
  [string, GeneralAssignmentNode[]][],
  Map<string, GeneralAssignmentNode[]>
>(
  R.filter(isGeneralAssignmentNode),
  R.groupBy(R.prop("name")),
  Object.entries,
  (e) => new Map(e)
);

type ValidationHook = (
  expressions: MathNode[],
  manager: ExpressionGraphManager
) => void;

const defaultValidateAddExpr: ValidationHook = () => {};

export default class ExpressionGraphManager {
  graph = new DirectedGraph<MathNode>([], []);

  dependents = new Map<string, Set<MathNode>>();

  allowedDuplicateLeafRegex: RegExp;

  private validateAddExpressions: ValidationHook;

  constructor(
    nodes: MathNode[] = [],
    {
      validateAddExpressions = defaultValidateAddExpr,
      allowedDuplicateLeafRegex = /^_/,
    }: {
      validateAddExpressions?: ValidationHook;
      allowedDuplicateLeafRegex?: RegExp;
    } = {}
  ) {
    this.allowedDuplicateLeafRegex = allowedDuplicateLeafRegex;
    this.validateAddExpressions = validateAddExpressions;
    this.addExpressions(nodes);
  }

  addExpressions(nodes: MathNode[]): void {
    this.validateAddExpressions(nodes, this);
    nodes.forEach((node) => {
      this.graph.addNode(node);
    });
    const { assignments, duplicates } =
      this.getAssignmentsAndDuplicatesByName();
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
        const dependencies = assignments.get(dependencyName) ?? [];
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

    /**
     * Establish edges between all duplicates with same name. This means
     * duplicate assignments create cycles. Why is this desirable?
     *
     * Our standard procedurate is that when nodes are added/removed from the
     * graph, we re-evaluate the reachable subgraph. So in this situation:
     *    Nodes:               current evaluation:
     *    --------------------------------------------
     *    A:   a = 1           a assigned value 1
     *    X:   a + 1           2
     * When A is deleted, we'll re-evaluate the reachable subgraph, in this
     * case, just X. The new evaluation will be "Error: 'a' is not defined".
     *
     * But in this situation:
     *
     *    Nodes:                current evaluation:
     *    --------------------------------------------
     *    A1:   a = 1           Error: duplicate assignment
     *    A2:   a = 2           Error: duplicate assignment
     *     X:   a + 1           Error: 'a' is not defined.
     *
     * When we delete A1, we need need to re-evaluate X **and** A2.
     *
     * In this sense, A2 depends on A1: its validity as an assignment depends on
     * whether A1 exists or not.
     *
     */
    duplicates.forEach((dupes) => {
      dupes.forEach((dupe1) => {
        dupes.forEach((dupe2) => {
          if (dupe1 !== dupe2 && !this.graph.hasEdge(dupe1, dupe2)) {
            this.graph.addEdge(dupe1, dupe2);
          }
        });
      });
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

  private getAssignmentsAndDuplicatesByName(): {
    assignments: Map<string, GeneralAssignmentNode[]>;
    duplicates: Map<string, GeneralAssignmentNode[]>;
  } {
    const assignments = getAssignmentNodesByName(
      Array.from(this.graph.getNodes())
    );
    const duplicates = new Map<string, GeneralAssignmentNode[]>();
    assignments.forEach((nodes, name) => {
      const duplicateAllowed =
        this.allowedDuplicateLeafRegex.test(name) &&
        nodes.every((node) => this.graph.isLeaf(node));
      if (nodes.length <= 1 || duplicateAllowed) return;
      duplicates.set(name, nodes);
    });

    return { assignments, duplicates };
  }

  getDuplicateAssignmentNodes(): Set<GeneralAssignmentNode> {
    const { duplicates } = this.getAssignmentsAndDuplicatesByName();
    const duplicatesSet = new Set<GeneralAssignmentNode>();
    duplicates.forEach((nodes) => {
      nodes.forEach((node) => duplicatesSet.add(node));
    });
    return duplicatesSet;
  }

  getEvaluationOrder(sources?: MathNode[]): {
    order: MathNode[];
    cycles: GeneralAssignmentNode[][];
  } {
    const subgraph =
      sources === undefined
        ? this.graph.copy()
        : this.graph.getReachableSubgraph(sources);
    const wholegraph = this.graph;

    // use the whole graph for cycles and duplicates
    const cycles = wholegraph.getCycles();
    cycles.flat().forEach((node) => {
      if (subgraph.hasNode(node)) {
        subgraph.deleteNode(node);
      }
    });

    const edges = subgraph.getEdges();
    const isolated = Array.from(subgraph.getIsolatedNodes());
    const order = toposort(edges.map((e) => [e.from, e.to])).concat(isolated);

    return {
      order,
      // Non-assignment nodes never have successors, so they can't be part of cycles
      cycles: cycles as GeneralAssignmentNode[][],
    };
  }
}
