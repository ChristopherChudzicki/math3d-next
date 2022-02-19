import { parse, MathNode } from "mathjs";
import * as R from "ramda";

import ExpressionGraphManager from "./ExpressionGraphManager";
import DirectedGraph from "./DirectedGraph";

import { permutations } from "../test_util";

const node = (id: string, parseable: string) => {
  const parsed = parse(parseable);
  parsed.comment = id;
  return parsed;
};
const edge = <T>(from: T, to: T) => ({ from, to });
const nodesById = (nodes: MathNode[]): Record<string, MathNode> => {
  const byId = R.indexBy((n) => n.comment, nodes);
  if (Object.keys(byId).length !== nodes.length) {
    throw new Error("Unexpected duplicate keys");
  }
  return byId;
};

describe("ExpressionGraphManager", () => {
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

  describe("Building and modifying an ExpressionGraphManager", () => {
    it("can add nodes during or after construction", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraphManager();
      expected.addExpressions(expressions);

      expect(new ExpressionGraphManager(expressions)).toStrictEqual(expected);
    });

    it("has the correct underlying DG after several addExpressions", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const result = new ExpressionGraphManager();
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

    it("has the correct underlying DG after a deleteExpression", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const result = new ExpressionGraphManager(expressions);
      result.deleteExpressions([b]);

      expect(result.graph).toStrictEqual(
        new DirectedGraph([a, c, x1], [edge(a, c), edge(a, x1), edge(c, x1)])
      );
    });

    it("builds the same ExpressionGraphManager regardless of the insertion order", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraphManager(expressions);

      permutations(expressions).forEach((nodes) => {
        const expressionGraphManager = new ExpressionGraphManager();
        nodes.forEach((n) => expressionGraphManager.addExpressions([n]));
        expect(expressionGraphManager).toStrictEqual(expected);
      });

      expect.assertions(24);
    });

    it("builds the same ExpressionGraphManager if extra nodes are added and removed", () => {
      const { a, b, c, x1 } = getExpressions1();
      const expressions = [a, b, c, x1];

      const expected = new ExpressionGraphManager(expressions);

      const d = node("id-d", "d = a * b * c");
      const x1alt = node("id-x1", "a + b + c +d");
      const graph = new ExpressionGraphManager();
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

      const expressionGraphManager = new ExpressionGraphManager([
        a1,
        a2,
        b1,
        b2,
        x1,
      ]);
      expect(expressionGraphManager.graph).toStrictEqual(
        new DirectedGraph(
          [a1, a2, b1, b2, x1],
          [
            edge(a1, x1),
            edge(a2, x1),
            edge(b1, x1),
            edge(b2, x1),
            edge(b1, a2),
            edge(b2, a2),
            edge(a1, a2),
            edge(a2, a1),
            edge(b1, b2),
            edge(b2, b1),
          ]
        )
      );

      permutations([[a1, b1], [a2, b2], [x1]]).forEach((permutation) => {
        const g = new ExpressionGraphManager();
        permutation.forEach((nodes) => {
          g.addExpressions(nodes);
        });
        expect(expressionGraphManager).toStrictEqual(g);
      });

      expect.assertions(7);
    });
  });

  // Test multiple assignments + cycles

  describe("#getDuplicateAssignmentNodes", () => {
    it("returns duplicate assignments nodes", () => {
      const a = node("id-a", "a=1");
      const b1 = node("id-b1", "b=1");
      const b2 = node("id-b2", "b=2");
      const c1 = node("id-c1", "c(x)=1");
      const c2 = node("id-c2", "c(x)=2");
      const c3 = node("id-c3", "c=3");
      const expressions = [a, b1, b2, c1, c2, c3];
      const manager = new ExpressionGraphManager(expressions);
      expect(manager.getDuplicateAssignmentNodes()).toStrictEqual(
        new Set([b1, b2, c1, c2, c3])
      );
    });

    it.each([
      [undefined, ["id-g1", "id-g2"]],
      [/gg/, ["id-f1", "id-f2"]],
      [/$^/, ["id-f1", "id-f2", "id-g1", "id-g2"]],
    ])(
      "allows duplicate leaves matching allowedDuplicateLeafRegex",
      (regex, expectedIds) => {
        const f1 = node("id-f1", "_f(x)=1");
        const f2 = node("id-f2", "_f(x)=2");
        const g1 = node("id-g1", "gg(x)=1");
        const g2 = node("id-g2", "gg(x)=2");
        const expressions = [f1, f2, g1, g2];
        const byId = nodesById(expressions);

        const manager = new ExpressionGraphManager(expressions, {
          allowedDuplicateLeafRegex: regex,
        });
        const dupes = manager.getDuplicateAssignmentNodes();
        expect(dupes).toStrictEqual(new Set(expectedIds.map((id) => byId[id])));
      }
    );

    it("only permits duplicate names on leaf nodes", () => {
      const f1 = node("id-f1", "_f(x)=x");
      const f2 = node("id-f2", "_f(x)=x");
      const a = node("id-a", "_f(5)");
      const expressions = [f1, f2, a];
      const manager = new ExpressionGraphManager(expressions);
      const dupes = manager.getDuplicateAssignmentNodes();
      expect(dupes).toStrictEqual(new Set([f1, f2]));
    });
  });

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

  describe("#getEvaluationOrder()", () => {
    it("returns a valid evaluation order", () => {
      const { a, b, c, d, e, f, g, h, x, y, z } = getExpressions2();
      const expressions = [a, b, c, d, e, f, g, h, x, y, z];
      const expressionGraphManager = new ExpressionGraphManager(expressions);

      const { order, cycles } = expressionGraphManager.getEvaluationOrder();
      expect(order).toStrictEqual([a, b, c, e, f, d, g, h, x, y, z]);
      expect(cycles).toStrictEqual([]);
    });

    it("includes isolated nodes", () => {
      const { a, b, c, d, e, f, g, h, x, y, z } = getExpressions2();
      const expressions = [a, b, c, d, e, f, g, h, x, y, z];
      const expressionGraphManager = new ExpressionGraphManager(expressions);
      const { order } = expressionGraphManager.getEvaluationOrder();
      expect(order).toContain(z);

      const { graph } = expressionGraphManager;
      expect(graph.getSuccessors(z)).toStrictEqual(new Set([]));
      expect(graph.getPredecessors(z)).toStrictEqual(new Set([]));
    });

    it("omits cycles, but includes cycle predecessor/successors", () => {
      const a = node("id-a", "a = 1");
      const b = node("id-b", "b = a + 1");
      const c = node("id-c", "c = b + d");
      const d = node("id-d", "d = b + c");
      const x = node("id-x", "x = c^2");
      const y = node("id-y", "y = x^2");
      const z = node("id-y", "z = c^2");
      const expressions = [a, b, c, d, x, y, z];

      const expressionGraphManager = new ExpressionGraphManager(expressions);
      const { order, cycles } = expressionGraphManager.getEvaluationOrder();

      /**
       * x and y will error during evaluation since their dependencies are not
       * met, but that's ok.
       */
      expect(order).toStrictEqual([a, b, x, y, z]);
      expect(cycles).toStrictEqual([[c, d]]);
    });

    it("includes duplicates as cycles", () => {
      const a = node("id-a", "a = 1");
      const b = node("id-b", "b = a + 1");
      const c1 = node("id-c1", "c = b + 1");
      const c2 = node("id-c2", "c = b + 2");
      const x = node("id-x", "x = b^2");
      const y1 = node("id-y1", "_f(x) = x^2");
      const y2 = node("id-y2", "_f(x) = x^3");
      const z = node("id-z", "z = c^2");
      const expressions = [a, b, c1, c2, x, y1, y2, z];

      const manager = new ExpressionGraphManager(expressions);
      const { order, cycles } = manager.getEvaluationOrder();

      expect(order).toStrictEqual([a, b, x, y1, y2, z]);
      expect(cycles).toStrictEqual([[c1, c2]]);
      expect(manager.getDuplicateAssignmentNodes()).toStrictEqual(
        new Set([c1, c2])
      );
    });
  });

  describe("#getEvaluationOrder(nodes)", () => {
    it("returns just the order for just the reachable subgraph when called with nodes", () => {
      const { a, b, c, d, e, f, g, h, x, y, z } = getExpressions2();
      const expressions = [a, b, c, d, e, f, g, h, x, y, z];
      const expressionGraphManager = new ExpressionGraphManager(expressions);

      const { order, cycles } = expressionGraphManager.getEvaluationOrder([
        c,
        x,
      ]);
      expect(order).toStrictEqual([c, e, f, h, x, y]);
      expect(cycles).toStrictEqual([]);
    });

    it("includes all cycles, not just the reachable ones", () => {
      const a = node("id-a", "a = b + 1");
      const b = node("id-b", "b = a + 1");
      const c1 = node("id-c1", "c = 1");
      const c2 = node("id-c2", "c = 2");
      const x = node("id-x", "x = 2");
      const y = node("id-y", "y = x^2");
      const z = node("id-y", "z = y^2");
      const expressions = [a, b, c1, c2, x, y, z];
      const manager = new ExpressionGraphManager(expressions);

      const { order, cycles } = manager.getEvaluationOrder([y]);
      expect(order).toStrictEqual([y, z]);
      expect(cycles).toStrictEqual([
        [b, a],
        [c2, c1],
      ]);
    });
  });
});
