export type DirectedEdge<T> = {
  from: T;
  to: T;
};

type DFSCallback<T> = (node: T, depth: number, graph: DirectedGraph<T>) => void;

export default class DirectedGraph<T> {
  private successors: Map<T, Set<T>>;

  constructor(edges: DirectedEdge<T>[]) {
    this.successors = new Map();

    edges.forEach((e) => this.addEdge(e.from, e.to));
  }

  addEdge(from: T, to: T): void {
    if (!this.successors.has(from)) {
      this.successors.set(from, new Set());
    }
    this.successors.get(from)?.add(to);
  }

  getSuccessors(node: T): Set<T> {
    return this.successors.get(node) ?? new Set();
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

  getReachableSubgraph(sources: Iterable<T>) {
    const nodes = [...sources].flatMap((source) => [
      source,
      ...this.getDescendants(source),
    ]);
    return new DirectedGraph(this.getEdgesFromNodes(nodes));
  }
}
