export type DirectedEdge<T> = {
  from: T;
  to: T;
};

type DFSCallback<T> = (node: T, depth: number, graph: DirectedGraph<T>) => void;

export default class DirectedGraph<T> {
  private successors: Map<T, Set<T>>;

  private predecessors: Map<T, Set<T>>;

  constructor(nodes: T[], edges: DirectedEdge<T>[]) {
    this.successors = new Map();
    this.predecessors = new Map();

    nodes.forEach((node) => this.addNode(node));
    edges.forEach((e) => this.addEdge(e.from, e.to));
  }

  hasNode(node: T): boolean {
    const p = this.predecessors.has(node);
    const s = this.successors.has(node);
    if (p && s) return true;
    if (!p && !s) return false;
    throw new Error("Unexpected: Inconsistent node record");
  }

  private assertNodeExists(node: T): void {
    if (this.hasNode(node)) return;
    throw new Error("Graph does not contain specified node.");
  }

  addNode(node: T): void {
    if (!this.successors.has(node)) {
      this.successors.set(node, new Set());
    }
    if (!this.predecessors.has(node)) {
      this.predecessors.set(node, new Set());
    }
  }

  addEdge(from: T, to: T): void {
    if (!this.hasNode(from)) {
      throw new Error('Cannot add edge; "from" node does not exist');
    }
    if (!this.hasNode(to)) {
      throw new Error('Cannot add edge; "to" node does not exist');
    }
    this.successors.get(from)?.add(to);
    this.predecessors.get(to)?.add(from);
  }

  hasEdge(from: T, to: T): boolean {
    const s = this.successors.get(from)?.has(to);
    const p = this.predecessors.get(to)?.has(from);
    if (s && p) return true;
    if (!s && !p) return false;
    throw new Error("Unexpected: Inconsistent edge record");
  }

  deleteEdge(from: T, to: T): void {
    if (!this.hasEdge(from, to)) {
      throw new Error("Specified edge does not exist; it cannot be deleted.");
    }
    this.successors.get(from)?.delete(to);
    this.predecessors.get(to)?.delete(from);
  }

  deleteNode(node: T) {
    this.assertNodeExists(node);
    this.getSuccessors(node).forEach((to) => {
      this.deleteEdge(node, to);
    });
    this.getPredecessors(node).forEach((from) => {
      this.deleteEdge(from, node);
    });
    this.successors.delete(node);
    this.predecessors.delete(node);
  }

  getSuccessors(node: T): Set<T> {
    this.assertNodeExists(node);
    const successors = this.successors.get(node);
    if (successors) return successors;
    throw new Error("Unreachable.");
  }

  getPredecessors(node: T): Set<T> {
    this.assertNodeExists(node);
    const predecessors = this.predecessors.get(node);
    if (predecessors) return predecessors;
    throw new Error("Unreachable.");
  }

  private dfsWithDepth(
    current: T,
    cb: DFSCallback<T>,
    depth: number,
    seen: Set<T>
  ): void {
    if (seen.has(current)) return;
    cb(current, depth, this);
    seen.add(current);
    this.getSuccessors(current).forEach((successor) => {
      this.dfsWithDepth(successor, cb, depth + 1, seen);
    });
  }

  dfs(start: T, cb: DFSCallback<T>): void {
    this.dfsWithDepth(start, cb, 0, new Set());
  }

  getDescendants(node: T): Set<T> {
    const descendants = new Set<T>();
    const storeDescendants: DFSCallback<T> = (current: T, depth: number) => {
      if (depth === 0) return;
      descendants.add(current);
    };
    this.dfs(node, storeDescendants);

    descendants.forEach((descendant) => {
      if (this.getSuccessors(descendant).has(node)) {
        descendants.add(node);
      }
    });
    if (this.getSuccessors(node).has(node)) {
      descendants.add(node);
    }

    return descendants;
  }

  private getEdgesFromNodes(nodes: Iterable<T>) {
    const nodeSet = new Set(nodes);
    return [...this.successors]
      .filter(([from]) => nodeSet.has(from))
      .flatMap(([from, successors]) =>
        [...successors].map((to) => ({ from, to }))
      );
  }

  getEdges(): DirectedEdge<T>[] {
    return this.getEdgesFromNodes(this.successors.keys());
  }

  getNodes(): Set<T> {
    return new Set(this.successors.keys());
  }

  getIsolatedNodes(): Set<T> {
    const isolated = new Set<T>();
    this.successors.forEach((successors, node) => {
      if (successors.size > 0) return;
      if (this.getPredecessors(node).size > 0) return;
      isolated.add(node);
    });
    return isolated;
  }

  getReachableSubgraph(sources: Iterable<T>) {
    const nodes = [...sources].flatMap((source) => [
      source,
      ...this.getDescendants(source),
    ]);
    return new DirectedGraph(nodes, this.getEdgesFromNodes(nodes));
  }
}
