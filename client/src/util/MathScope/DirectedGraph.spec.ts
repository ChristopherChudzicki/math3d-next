import DirectedGraph from "./DirectedGraph";

const node = (id: string) => ({ id });
const edge = <T>(from: T, to: T) => ({ from, to });

describe("DirectedGraph", () => {
  /**
   * Graph 1:
   *
   *  a --> b --> c
   *        \
   *         \--> d -\
   *               \<-
   *
   */
  const makeGraph1 = () => {
    const nodes = [..."abcd"].map(node);
    const [a, b, c, d] = nodes;
    const graph = new DirectedGraph([
      edge(a, b),
      edge(b, c),
      edge(b, d),
      edge(d, d),
    ]);

    expect(nodes.every((n) => !!n)).toBe(true);

    return { nodes, graph };
  };

  describe("getSuccessors and getPredecessors", () => {
    it("retrieves edges from/to a particular node", () => {
      const { graph, nodes } = makeGraph1();
      const [a, b, c, d] = nodes;

      graph.deleteEdge(b, d);

      expect(graph.getSuccessors(a)).toStrictEqual(new Set([b]));
      expect(graph.getSuccessors(b)).toStrictEqual(new Set([c]));
      expect(graph.getSuccessors(c)).toStrictEqual(new Set([]));
      expect(graph.getSuccessors(d)).toStrictEqual(new Set([d]));

      expect(graph.getPredecessors(a)).toStrictEqual(new Set());
      expect(graph.getPredecessors(b)).toStrictEqual(new Set([a]));
      expect(graph.getPredecessors(c)).toStrictEqual(new Set([b]));
      expect(graph.getPredecessors(d)).toStrictEqual(new Set([d]));
    });

    it("returns correct results after addEdge", () => {
      const { graph, nodes } = makeGraph1();
      const [a, b, c, d] = nodes;
      const e = node("e");

      graph.addEdge(a, e);
      graph.addEdge(e, c);

      expect(graph.getSuccessors(a)).toStrictEqual(new Set([b, e]));
      expect(graph.getSuccessors(b)).toStrictEqual(new Set([c, d]));
      expect(graph.getSuccessors(c)).toStrictEqual(new Set([]));
      expect(graph.getSuccessors(d)).toStrictEqual(new Set([d]));
      expect(graph.getSuccessors(e)).toStrictEqual(new Set([c]));

      expect(graph.getPredecessors(a)).toStrictEqual(new Set());
      expect(graph.getPredecessors(b)).toStrictEqual(new Set([a]));
      expect(graph.getPredecessors(c)).toStrictEqual(new Set([b, e]));
      expect(graph.getPredecessors(d)).toStrictEqual(new Set([b, d]));
      expect(graph.getPredecessors(e)).toStrictEqual(new Set([a]));
    });

    it("returns correct results after deleteEdge", () => {
      const { graph, nodes } = makeGraph1();
      const [a, b, c, d] = nodes;

      expect(graph.getSuccessors(a)).toStrictEqual(new Set([b]));
      expect(graph.getSuccessors(b)).toStrictEqual(new Set([c, d]));
      expect(graph.getSuccessors(c)).toStrictEqual(new Set([]));
      expect(graph.getSuccessors(d)).toStrictEqual(new Set([d]));

      expect(graph.getPredecessors(a)).toStrictEqual(new Set());
      expect(graph.getPredecessors(b)).toStrictEqual(new Set([a]));
      expect(graph.getPredecessors(c)).toStrictEqual(new Set([b]));
      expect(graph.getPredecessors(d)).toStrictEqual(new Set([b, d]));
    });
  });

  describe("getEdges", () => {
    it("retrieves an array of all edges in the graph", () => {
      const { graph, nodes } = makeGraph1();
      const [a, b, c, d] = nodes;

      expect(graph.getEdges()).toEqual([
        { from: a, to: b },
        { from: b, to: c },
        { from: b, to: d },
        { from: d, to: d },
      ]);
    });
  });

  /**
   * Graph 2: all edges are downward
   *
   *      a ->-\
   *      \     |
   *       \    b    c
   *        \  /  \ / \
   *         d    e    f
   *        /     \
   *       g      h
   *      /
   *     i
   */
  const makeGraph2 = () => {
    const nodes = [..."abcdefghi"].map(node);
    const [a, b, c, d, e, f, g, h, i] = nodes;
    const edges = [
      edge(a, b),
      edge(a, d),
      edge(b, d),
      edge(b, e),
      edge(c, e),
      edge(c, f),
      edge(d, g),
      edge(e, h),
      edge(g, i),
    ];
    expect(nodes.every((n) => !!n)).toBe(true);
    const graph = new DirectedGraph(edges);
    return { nodes, graph };
  };

  describe("depth-first search", () => {
    it("calls the given callback with currentNode, depth, and graph", () => {
      const { graph, nodes } = makeGraph2();
      const [, b, , d, e, , g, h, i] = nodes;
      const cb = jest.fn();
      graph.dfs(b, cb);

      expect(cb.mock.calls).toEqual([
        [b, 0, graph],
        [d, 1, graph],
        [g, 2, graph],
        [i, 3, graph],
        [e, 1, graph],
        [h, 2, graph],
      ]);
    });

    it("terminates even when graph has cycles", () => {
      const [a, b] = [..."abc"].map(node);
      const graph = new DirectedGraph([edge(a, b), edge(b, a)]);

      const cb = jest.fn();
      graph.dfs(a, cb);
      expect(cb.mock.calls).toEqual([
        [a, 0, graph],
        [b, 1, graph],
      ]);
    });
  });

  describe("getDescendants", () => {
    it("gets all descendants of given nodes", () => {
      const { graph, nodes } = makeGraph2();
      const [a, b, c, d, e, f, g, h, i] = nodes;

      expect(graph.getDescendants(a)).toStrictEqual(
        new Set([b, d, e, g, h, i])
      );

      expect(graph.getDescendants(c)).toStrictEqual(new Set([e, f, h]));
    });

    it("only includes self as descendant for cycles", () => {
      const [a, b, c] = [..."abc"].map(node);
      const graph = new DirectedGraph([edge(a, b), edge(b, c)]);

      expect(graph.getDescendants(a)).toStrictEqual(new Set([b, c]));
      graph.addEdge(b, a);
      expect(graph.getDescendants(a)).toStrictEqual(new Set([a, b, c]));
    });

    it("includes self as a descendant for cycles of length 1", () => {
      const [a] = [..."a"].map(node);
      const graph = new DirectedGraph([edge(a, a)]);

      expect(graph.getDescendants(a)).toStrictEqual(new Set([a]));
    });
  });

  describe("getReachableSubgraph", () => {
    it("returns subgraph reachable from given nodes", () => {
      const { graph, nodes } = makeGraph2();
      const [, b, c, d, e, f, g, h, i] = nodes;

      expect(graph.getReachableSubgraph([b])).toStrictEqual(
        new DirectedGraph([
          edge(b, d),
          edge(b, e),
          edge(d, g),
          edge(e, h),
          edge(g, i),
        ])
      );

      expect(graph.getReachableSubgraph([c, g])).toStrictEqual(
        new DirectedGraph([edge(c, e), edge(c, f), edge(e, h), edge(g, i)])
      );
    });
  });
});
