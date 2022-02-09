import { exp, index, MathNode, parse } from "mathjs";

import ExpressionGraph from "./ExpressionGraph";
import DirectedGraph from "./DirectedGraph";

import { permutations } from "../test_util";

const node = (id: string, parseable: string) => {
  const parsed = parse(parseable);
  parsed.comment = id;
  return parsed;
};
const edge = <T>(from: T, to: T) => ({ from, to });

describe("ExpressionGraph", () => {
  /*
   *     a = 2
   *     b = 3
   *     c = a^2
   *     d = a + b
   *     e = x => b*x
   *     f = e(2)
   *     expr1: c - d
   *     expr2:  2d + b
   *     expr3: x => f - x
   *     expr4: 4 + 6         (isolated)
   *
   *            a     b
   *          /  \  / | \
   *         /    \/  |  \
   *        c     d   |   e
   *        \    / \  |    \
   *         expr1   expr2  f
   *                         \
   *                         expr3
   *
   */

  /**
   * ```
   * /----->--------\
   * a ----> b ----> c ----> x1
   * \      \     \---->----/
   *  \      \------->-----/
   *   \----------->------/
   * ```
   */
  const getExpressions1 = () => {
    const expressions = [
      node("id-a", "a = 2"),
      node("id-b", "b = 2*a"),
      node("id-c", "c = 2*b + a"),
      node("id-x1", "a + b + c"),
    ];
    const [a, b, c, x1] = expressions;
    return { a, b, c, x1 };
  };

  describe("Building and modifying an ExpressionGraph", () => {
    it("can add nodes during or after construction", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraph();
      expected.addExpressions(expressions);

      expect(new ExpressionGraph(expressions)).toStrictEqual(expected);
    });

    it("has the correct underlying DAG after several addExpressions", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const result = new ExpressionGraph();
      result.addExpressions(expressions);

      expect(result.graph).toStrictEqual(
        new DirectedGraph(expressions, [
          edge(a, b),
          edge(a, c),
          edge(b, c),
          edge(a, x1),
          edge(b, x1),
          edge(c, x1),
        ])
      );
    });

    it("has the correct underlying DAG after a deleteExpression", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const result = new ExpressionGraph(expressions);
      result.deleteExpressions([b]);

      expect(result.graph).toStrictEqual(
        new DirectedGraph([a, c, x1], [edge(a, c), edge(a, x1), edge(c, x1)])
      );
    });

    it("builds the same ExpressionGraph regardless of the insertion order", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraph(expressions);

      permutations(expressions).forEach((nodes) => {
        const expressionGraph = new ExpressionGraph();
        nodes.forEach((n) => expressionGraph.addExpressions([n]));
        expect(expressionGraph).toStrictEqual(expected);
      });

      expect.assertions(24);
    });

    it("builds the same ExpressionGraph if extra nodes are added and removed", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraph(expressions);

      const d = node("id-d", "d = a * b * c");
      const x1alt = node("id-x1", "a + b + c +d");
      const graph = new ExpressionGraph();
      graph.addExpressions([a, b, c, x1, d]);
      graph.deleteExpressions([x1]);
      graph.addExpressions([x1alt]);
      graph.deleteExpressions([x1alt]);
      graph.addExpressions([x1]);
      graph.deleteExpressions([d]);

      expect(graph).toStrictEqual(expected);
    });

    it("handles multiple assignments", () => {
      const a1 = node("id-a1", "a = 2");
      const a2 = node("id-a2", "a = 2 + b");
      const b1 = node("id-b1", "b = 1");
      const b2 = node("id-b2", "b = 2");
      const x1 = node("id-x1", "x = a + b");

      const expressionGraph = new ExpressionGraph([a1, a2, b1, b2, x1]);
      expect(expressionGraph.graph).toStrictEqual(
        new DirectedGraph(
          [a1, a2, b1, b2, x1],
          [
            edge(a1, x1),
            edge(a2, x1),
            edge(b1, x1),
            edge(b2, x1),
            edge(b1, a2),
            edge(b2, a2),
          ]
        )
      );

      permutations([[a1, b1], [a2, b2], [x1]]).forEach((permutation) => {
        const g = new ExpressionGraph();
        permutation.forEach((nodes) => {
          g.addExpressions(nodes);
        });
        expect(expressionGraph).toStrictEqual(g);
      });

      expect.assertions(7);
    });
  });

  // Test multiple assignments + cycles

  describe("#getEvaluationOrder", () => {
    /**
     * ```
     *       a     b
     *      /\\  /  \
     *     /  \c    d         x
     *    /  / \\     \       |
     *     e    f     g      y     z
     *    |   /
     *     h
     * ```
     */
    const getExpressions2 = () => {
      const a = node("id-a", "a = 2");
      const b = node("id-b", "b(x) = x^2");
      const c = node("id-c", "c(y) = a + b(y)");
      const d = node("id-d", "d = b(2)");
      const e = node("id-e", "e = a + c(1)");
      const f = node("id-f", "f = c(a)");
      const g = node("id-g", "d + 1");
      const h = node("id-h", "e + f");
      const x = node("id-x", "x = 2");
      const y = node("id-y", "y = x^2");
      const z = node("id-z", "sin(omega)");
      return { a, b, c, d, e, f, g, h, x, y, z };
    };

    it("returns a valid evaluation order", () => {
      const { a, b, c, d, e, f, g, h, x, y, z } = getExpressions2();
      const expressions = [a, b, c, d, e, f, g, h, x, y, z];
      const expressionGraph = new ExpressionGraph(expressions);

      const expectedOrder = [a, b, c, e, f, d, g, h, x, y, z];
      expect(expressionGraph.getEvaluationOrder()).toStrictEqual(expectedOrder);
    });

    it("includes isolated nodes", () => {
      const { a, b, c, d, e, f, g, h, x, y, z } = getExpressions2();
      const expressions = [a, b, c, d, e, f, g, h, x, y, z];
      const expressionGraph = new ExpressionGraph(expressions);
      expect(expressionGraph.getEvaluationOrder()).toContain(z);

      const dag = expressionGraph.graph;
      expect(dag.getSuccessors(z)).toStrictEqual(new Set([]));
      expect(dag.getPredecessors(z)).toStrictEqual(new Set([]));
    });

    it("returns just the reachable subgraph when called with nodes", () => {});

    it("omits cycles, but includes cycle predecessor/successors", () => {
      const a = node("id-a", "a = 1");
      const b = node("id-b", "b = a + 1");
      const c = node("id-c", "c = b + d");
      const d = node("id-d", "d = b + c");
      const x = node("id-x", "x = c^2");
      const y = node("id-y", "y = x^2");
      const expressions = [a, b, c, d, x, y];

      const expressionGraph = new ExpressionGraph(expressions);
      const evalOrder = expressionGraph.getEvaluationOrder();
    });
  });

  describe("#addExpressions", () => {});

  describe("#deleteExpressions", () => {});

  describe("#updateExpressions", () => {});
});
