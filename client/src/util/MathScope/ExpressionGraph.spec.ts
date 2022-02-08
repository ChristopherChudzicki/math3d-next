import { parse } from "mathjs";

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
  });

  // Test multiple assignments + cycles

  describe("#getEvaluationOrder", () => {});

  describe("#addExpressions", () => {});

  describe("#deleteExpressions", () => {});

  describe("#updateExpressions", () => {});
});
