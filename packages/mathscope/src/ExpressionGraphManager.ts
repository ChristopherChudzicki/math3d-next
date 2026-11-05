import toposort from "toposort";

import type { AnonAssignmentNode, AnonMathNode } from "./interfaces";
import { DirectedGraph, isAssignmentNode } from "./util";

const overridesNothing = () => false;

/**
 * Helps manage a dependency graph for mathematical expressions.
 *
 * For example:
 * ```ts
 * import { parse } from 'mathjs'
 * const manager = new ExpressionGraphManager()
 * const a = parse('a = 2')
 * const b = parse('b = a + 1')
 * const expr1 = parse('a + b')
 * manager.addExpressions([a, b, expr])
 * ```
 *
 * Includes helpers for:
 *  - finding a valid evaluation order of this graph
 *  - finding cycles and duplicate assignment nodes
 *
 * An assignment for which `isOverridable` is true is *shadowed* while the graph
 * also holds a non-overridable assignment of the same name. A shadowed node is
 * never a duplicate, and its value must not reach its dependents.
 */
export default class ExpressionGraphManager<
  N extends AnonMathNode = AnonMathNode,
> {
  graph = new DirectedGraph<N>([], []);

  dependents = new Map<string, Set<N>>();

  allowedDuplicateLeafRegex: RegExp;

  private isOverridable: (node: N) => boolean;

  private assignmentsByName = new Map<string, Set<N & AnonAssignmentNode>>();

  constructor(
    nodes: N[] = [],
    {
      allowedDuplicateLeafRegex = /^_/,
      isOverridable = overridesNothing,
    }: {
      allowedDuplicateLeafRegex?: RegExp;
      isOverridable?: (node: N) => boolean;
    } = {},
  ) {
    this.allowedDuplicateLeafRegex = allowedDuplicateLeafRegex;
    this.isOverridable = isOverridable;
    this.addExpressions(nodes);
  }

  isShadowed(node: N): boolean {
    if (!isAssignmentNode(node) || !this.isOverridable(node)) return false;
    const sameName = this.assignmentsByName.get(node.name) ?? [];
    return [...sameName].some((other) => !this.isOverridable(other));
  }

  addExpressions(nodes: N[]): void {
    nodes.forEach((node) => {
      this.graph.addNode(node);
      if (isAssignmentNode(node)) {
        const sameName = this.assignmentsByName.get(node.name) ?? new Set();
        sameName.add(node);
        this.assignmentsByName.set(node.name, sameName);
      }
    });
    const { assignments } = this.getAssignmentsAndDuplicatesByName();
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
      node.dependencies.forEach((dependencyName) => {
        const dependencies = assignments.get(dependencyName) ?? [];
        dependencies.forEach((dependency) => {
          this.graph.addEdge(dependency, node);
        });
      });

      this.registerDependencies(node);
      // construct edges from this node TO its dependents
      if (isAssignmentNode(node)) {
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
     * Our standard procedure is that when nodes are added/removed from the
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
     * Duplicates are found only now, once this batch's edges exist: whether a
     * `_` name may repeat depends on whether anything uses it.
     */
    const { duplicates } = this.getAssignmentsAndDuplicatesByName();
    duplicates.forEach((dupes) => {
      dupes.forEach((dupe1) => {
        dupes.forEach((dupe2) => {
          if (dupe1 !== dupe2 && !this.graph.hasEdge(dupe1, dupe2)) {
            this.graph.addEdge(dupe1, dupe2);
          }
        });
      });
    });

    // Adding or deleting an overriding node re-evaluates the node it shadows,
    // and so that node's dependents.
    const names = new Set(nodes.filter(isAssignmentNode).map((n) => n.name));
    names.forEach((name) => {
      const sameName = [...(assignments.get(name) ?? [])];
      const overridable = sameName.filter((n) => this.isOverridable(n));
      sameName
        .filter((n) => !this.isOverridable(n))
        .forEach((overriding) => {
          overridable.forEach((shadowed) => {
            if (!this.graph.hasEdge(overriding, shadowed)) {
              this.graph.addEdge(overriding, shadowed);
            }
          });
        });
    });
  }

  private registerDependencies(node: N): void {
    node.dependencies.forEach((dependencyName) => {
      const dependents = this.dependents.get(dependencyName) ?? new Set<N>();
      dependents.add(node);
      this.dependents.set(dependencyName, dependents);
    });
  }

  private unregisterDependencies(node: N): void {
    node.dependencies.forEach((dependencyName) => {
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

  deleteExpressions(nodes: N[]): void {
    nodes.forEach((node) => {
      this.graph.deleteNode(node);
      this.unregisterDependencies(node);
      if (isAssignmentNode(node)) {
        const sameName = this.assignmentsByName.get(node.name);
        sameName?.delete(node);
        if (sameName?.size === 0) this.assignmentsByName.delete(node.name);
      }
    });
  }

  private getAssignmentsAndDuplicatesByName(): {
    assignments: Map<string, (N & AnonAssignmentNode)[]>;
    duplicates: Map<string, (N & AnonAssignmentNode)[]>;
  } {
    const assignments = new Map(
      [...this.assignmentsByName].map(([name, nodes]) => [name, [...nodes]]),
    );
    const duplicates = new Map<string, (N & AnonAssignmentNode)[]>();
    assignments.forEach((sameName, name) => {
      const nodes = sameName.filter((node) => !this.isShadowed(node));
      const duplicateAllowed =
        this.allowedDuplicateLeafRegex.test(name) &&
        nodes.every((node) => this.graph.isLeaf(node));
      if (nodes.length <= 1 || duplicateAllowed) return;
      duplicates.set(name, nodes);
    });

    return { assignments, duplicates };
  }

  getDuplicateAssignmentNodes(): Set<AnonAssignmentNode & N> {
    const { duplicates } = this.getAssignmentsAndDuplicatesByName();
    const duplicatesSet = new Set<AnonAssignmentNode & N>();
    duplicates.forEach((nodes) => {
      nodes.forEach((node) => duplicatesSet.add(node));
    });
    return duplicatesSet;
  }

  getEvaluationOrder(sources?: Iterable<N>): {
    order: N[];
    cycles: (N & AnonAssignmentNode)[][];
  } {
    const subgraph =
      sources === undefined
        ? this.graph.copy()
        : this.graph.getReachableSubgraph(sources);

    // A shadowed node's value never reaches its dependents.
    subgraph.getNodes().forEach((node) => {
      if (!this.isShadowed(node)) return;
      [...subgraph.getSuccessors(node)].forEach((successor) => {
        subgraph.deleteEdge(node, successor);
      });
    });

    // Non-assignment nodes never have successors, so they can't be part of cycles
    const cycles = subgraph.getCycles() as (AnonAssignmentNode & N)[][];

    cycles.flat().forEach((node) => {
      if (subgraph.hasNode(node)) {
        subgraph.deleteNode(node);
      }
    });

    const edges = subgraph.getEdges();
    const isolated = Array.from(subgraph.getIsolatedNodes());
    const order = toposort(edges.map((e) => [e.from, e.to])).concat(isolated);

    return { order, cycles };
  }
}
