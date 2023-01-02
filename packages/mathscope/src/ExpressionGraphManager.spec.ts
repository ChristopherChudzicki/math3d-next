import { describe, it, expect } from "vitest";
import { permutations } from "@math3d/utils";

import { parse } from "./adapter";
import ExpressionGraphManager from "./ExpressionGraphManager";
import { DirectedGraph } from "./util";

const edge = <T>(from: T, to: T) => ({ from, to });

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
      parse("a = 2"),
      parse("b = 2*a"),
      parse("c = 2*b + a"),
      parse("a + b + c"),
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

      const d = parse("d = a * b * c");
      const x1alt = parse("a + b + c +d");
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
      const a1 = parse("a = 2");
      const a2 = parse("a = 2 + b");
      const b1 = parse("b = 1");
      const b2 = parse("b = 2");
      const x1 = parse("x = a + b");

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
      const a = parse("a=1");
      const b1 = parse("b=1");
      const b2 = parse("b=2");
      const c1 = parse("c(x)=1");
      const c2 = parse("c(x)=2");
      const c3 = parse("c=3");
      const expressions = [a, b1, b2, c1, c2, c3];
      const manager = new ExpressionGraphManager(expressions);
      expect(manager.getDuplicateAssignmentNodes()).toStrictEqual(
        new Set([b1, b2, c1, c2, c3])
      );
    });

    it.each([
      {
        regex: undefined,
        expectedDuplicateNames: ["g1", "g2"] as const,
      },
      {
        regex: /gg/,
        expectedDuplicateNames: ["f1", "f2"] as const,
      },
      {
        regex: /$^/,
        expectedDuplicateNames: ["f1", "f2", "g1", "g2"] as const,
      },
    ])(
      "allows duplicate leaves matching allowedDuplicateLeafRegex",
      ({ regex, expectedDuplicateNames }) => {
        const f1 = parse("_f(x)=1");
        const f2 = parse("_f(x)=2");
        const g1 = parse("gg(x)=1");
        const g2 = parse("gg(x)=2");
        const nodes = { f1, f2, g1, g2 };
        const expressions = [f1, f2, g1, g2];

        const manager = new ExpressionGraphManager(expressions, {
          allowedDuplicateLeafRegex: regex,
        });
        const dupes = manager.getDuplicateAssignmentNodes();
        expect(dupes).toStrictEqual(
          new Set(expectedDuplicateNames.map((id) => nodes[id]))
        );
      }
    );

    it("only permits duplicate names on leaf nodes", () => {
      const f1 = parse("_f(x)=x");
      const f2 = parse("_f(x)=x");
      const a = parse("_f(5)");
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
    const a = parse("a = 2");
    const b = parse("b(x) = x^2");
    const c = parse("c(y) = a + b(y)");
    const d = parse("d = b(2)");
    const e = parse("e = a + c(1)");
    const f = parse("f = c(a)");
    const g = parse("d + 1");
    const h = parse("e + f");
    const x = parse("x = 2");
    const y = parse("y = x^2");
    const z = parse("sin(omega)");
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
      const a = parse("a = 1");
      const b = parse("b = a + 1");
      const c = parse("c = b + d");
      const d = parse("d = b + c");
      const x = parse("x = c^2");
      const y = parse("y = x^2");
      const z = parse("z = c^2");
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
      const a = parse("a = 1");
      const b = parse("b = a + 1");
      const c1 = parse("c = b + 1");
      const c2 = parse("c = b + 2");
      const x = parse("x = b^2");
      const y1 = parse("_f(x) = x^2");
      const y2 = parse("_f(x) = x^3");
      const z = parse("z = c^2");
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

    it("includes only the reachable cycles", () => {
      const a = parse("a = b + 1");
      const b = parse("b = a + 1");
      const c1 = parse("c = 1");
      const c2 = parse("c = 2");
      const x = parse("x = 2");
      const y = parse("y = x^2");
      const z = parse("z = y^2");
      const expressions = [a, b, c1, c2, x, y, z];
      const manager = new ExpressionGraphManager(expressions);

      const { order, cycles } = manager.getEvaluationOrder([y, a]);
      expect(order).toStrictEqual([y, z]);
      expect(cycles).toStrictEqual([[b, a]]);
    });
  });
});
