import { describe, it, expect, vi } from "vitest";
import DirectedGraph from "./DirectedGraph";

const node = (id: string) => ({ id });
const edge = <T>(from: T, to: T) => ({ from, to });

describe("DirectedGraph", () => {
  /**
   * Graph 1:
   *
   *  a --> b --> c   e
   *        \
   *         \--> d -\
   *               \<-
   *
   */
  describe("#getSuccessors", () => {
    it("retrieves successor nodes", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d, e] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);
      expect(graph.getSuccessors(a)).toStrictEqual(new Set([b]));
      expect(graph.getSuccessors(b)).toStrictEqual(new Set([c, d]));
      expect(graph.getSuccessors(c)).toStrictEqual(new Set([]));
      expect(graph.getSuccessors(d)).toStrictEqual(new Set([d]));
      expect(graph.getSuccessors(e)).toStrictEqual(new Set([]));
    });
  });

  describe("#getPredecessors", () => {
    it("retrieves predecessor nodes", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d, e] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);
      expect(graph.getPredecessors(a)).toStrictEqual(new Set());
      expect(graph.getPredecessors(b)).toStrictEqual(new Set([a]));
      expect(graph.getPredecessors(c)).toStrictEqual(new Set([b]));
      expect(graph.getPredecessors(d)).toStrictEqual(new Set([d, b]));
      expect(graph.getPredecessors(e)).toStrictEqual(new Set([]));
    });
  });

  describe("#addEdge", () => {
    it("updates the graph with new edge", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);

      graph.addEdge(d, b);
      expect(graph).toStrictEqual(
        new DirectedGraph(nodes, [...edges, edge(d, b)]),
      );
    });

    it("throws an error if the graph does not contain 'from' node", () => {
      const graph = new DirectedGraph<string>([], []);
      expect(() => graph.addEdge("a", "b")).toThrow(
        /Cannot add edge; "from" node does not exist/,
      );
    });

    it("throws an error if the graph does not contain 'to' node", () => {
      const graph = new DirectedGraph<string>(["a"], []);
      expect(() => graph.addEdge("a", "b")).toThrow(
        /Cannot add edge; "to" node does not exist/,
      );
    });
  });

  describe("#deleteEdge", () => {
    it("updates the graph with removed edge", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);
      graph.deleteEdge(b, d);
      expect(graph).toStrictEqual(
        new DirectedGraph(nodes, [edge(a, b), edge(b, c), edge(d, d)]),
      );
    });

    it("throws an error if the edge does not exist", () => {
      const graph = new DirectedGraph<string>([], []);
      expect(() => graph.deleteEdge("a", "b")).toThrow(
        /Specified edge does not exist/,
      );
    });
  });

  describe("#eleteNode", () => {
    it("updates the graph with removed edge", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d, e] = nodes;
      const edges = [
        edge(a, b),
        edge(a, d),
        edge(b, c),
        edge(b, d),
        edge(d, d),
      ];
      const graph = new DirectedGraph(nodes, edges);

      graph.deleteNode(b);
      expect(graph).toStrictEqual(
        new DirectedGraph([a, c, d, e], [edge(a, d), edge(d, d)]),
      );
    });

    it("throws an error if the edge does not exist", () => {
      const graph = new DirectedGraph<string>([], []);
      expect(() => graph.deleteEdge("a", "b")).toThrow(
        /Specified edge does not exist/,
      );
    });
  });

  describe("#getEdges", () => {
    it("retrieves an array of all edges in the graph", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(graph.getEdges()).toEqual(edges);
    });
  });

  describe("#getNodes", () => {
    it("retrieves a set of all nodes in the graph", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d, e] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);
      expect(graph.getNodes()).toEqual(new Set([a, b, c, d, e]));
    });
  });

  describe("#getIsolatedNodes", () => {
    it("retrieves a set of the isolated nodes in the graph", () => {
      const nodes = [..."abcde"].map(node);
      const [a, b, c, d, e] = nodes;
      const edges = [edge(a, b), edge(b, c), edge(b, d), edge(d, d)];
      const graph = new DirectedGraph(nodes, edges);

      expect(nodes.every((n) => !!n)).toBe(true);
      expect(graph.getIsolatedNodes()).toEqual(new Set([e]));
    });
  });

  describe("#hasNode", () => {
    it("returns true [false] if graph has [does not have] node", () => {
      const graph = new DirectedGraph<string>(["a"], []);
      expect(graph.hasNode("a")).toBe(true);
      expect(graph.hasNode("b")).toBe(false);
    });
  });

  describe("#hasEdge", () => {
    it("returns true [false] if graph has [does not have] node", () => {
      const [a, b] = [node("a"), node("b")];
      const c = node("c");
      const graph = new DirectedGraph([a, b], [edge(a, b)]);
      expect(graph.hasEdge(a, b)).toBe(true);
      expect(graph.hasEdge(b, a)).toBe(false);
      expect(graph.hasEdge(a, c)).toBe(false);
      expect(graph.hasEdge(c, a)).toBe(false);
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
    const graph = new DirectedGraph(nodes, edges);
    return { nodes, graph };
  };

  describe("depth-first search", () => {
    it("calls the given callback with currentNode, depth, and graph", () => {
      const { graph, nodes } = makeGraph2();
      const [, b, , d, e, , g, h, i] = nodes;
      const cb = vi.fn();
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
      const nodes = [..."abc"].map(node);
      const [a, b] = nodes;
      const graph = new DirectedGraph(nodes, [edge(a, b), edge(b, a)]);

      const cb = vi.fn();
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
        new Set([b, d, e, g, h, i]),
      );

      expect(graph.getDescendants(c)).toStrictEqual(new Set([e, f, h]));
    });

    it("only includes self as descendant for cycles", () => {
      const [a, b, c] = [..."abc"].map(node);
      const graph = new DirectedGraph([a, b, c], [edge(a, b), edge(b, c)]);

      expect(graph.getDescendants(a)).toStrictEqual(new Set([b, c]));
      graph.addEdge(b, a);
      expect(graph.getDescendants(a)).toStrictEqual(new Set([a, b, c]));
    });

    it("includes self as a descendant for cycles of length 1", () => {
      const [a] = [..."a"].map(node);
      const graph = new DirectedGraph([a], [edge(a, a)]);

      expect(graph.getDescendants(a)).toStrictEqual(new Set([a]));
    });
  });

  describe("getReachableSubgraph", () => {
    it("returns subgraph reachable from given nodes", () => {
      const { graph, nodes } = makeGraph2();
      const [, b, c, d, e, f, g, h, i] = nodes;

      expect(graph.getReachableSubgraph([b])).toStrictEqual(
        new DirectedGraph(
          [b, d, e, g, h, i],
          [edge(b, d), edge(b, e), edge(d, g), edge(e, h), edge(g, i)],
        ),
      );

      expect(graph.getReachableSubgraph([c, g])).toStrictEqual(
        new DirectedGraph(
          [c, e, f, g, h, i],
          [edge(c, e), edge(c, f), edge(e, h), edge(g, i)],
        ),
      );
    });
  });

  describe("getCycles", () => {
    it("returns an array of cycles", () => {
      const a = node("id-a");
      const b = node("id-b");
      const c = node("id-c");
      const x = node("id-x");
      const y = node("id-y");
      const z = node("id-z");
      const s = node("id-s");
      const t = node("id-t");

      /**
       *               /----------->-----------\
       *      /--->---/----------->-----\       \
       *    /        /                   \       \
       *   x--->---y--->---z--->---a ---> b ---> c
       *                           \           /
       *                            \----<----/
       *
       *    s ---->----t
       *     \---<----/
       */

      const edges = [
        edge(x, y),
        edge(y, z),
        edge(z, a),
        edge(a, b),
        edge(b, c),
        edge(c, a),
        edge(x, b),
        edge(y, c),
        edge(s, t),
        edge(t, s),
      ];
      const nodes = [a, b, c, x, y, z, s, t];
      const graph = new DirectedGraph(nodes, edges);
      expect(graph.getCycles()).toStrictEqual([
        [c, b, a],
        [t, s],
      ]);
    });
  });
});
