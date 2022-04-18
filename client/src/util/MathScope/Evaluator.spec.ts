import { parse } from "mathjs";
import Evaluator, { UnmetDependencyError as UnmetDepErr } from "./Evaluator";

const node = (id: string, parseable: string) => {
  const parsed = parse(parseable);
  parsed.comment = id;
  return parsed;
};

const asMap = (obj: Record<string, unknown>) => new Map(Object.entries(obj));

describe("Evaluator", () => {
  describe("#evaluate()", () => {
    it("evaluates the given nodes, exposing result on Evaluator.result", () => {
      const a = node("id-a", "a = b^2");
      const b = node("id-b", "b = 2");
      const expr1 = node("id-expr1", "a + b");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, expr1]);
      evaluator.evaluateAll();
      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": 4,
          "id-b": 2,
          "id-expr1": 6,
        })
      );
    });

    it("records unment dependency errors for non-function evaluations", () => {
      const a = node("id-a", "a = 2");
      const b = node("id-b", "b = a^2");
      const c = node("id-c", "c = b + x");
      const expr1 = node("id-expr1", "b + c + x");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, c, expr1]);
      evaluator.evaluateAll();
      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": 2,
          "id-b": 4,
        })
      );
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-c": new UnmetDepErr(["x"]),
          "id-expr1": new UnmetDepErr(["c", "x"]),
        })
      );
    });

    it("records unment dependency errors for function evaluations", () => {
      const f = node("id-f", "f(x, y) = a + b + x + y");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([f]);
      evaluator.evaluateAll();
      expect(evaluator.results).toStrictEqual(asMap({}));
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-f": new UnmetDepErr(["a", "b"]),
        })
      );
    });

    it("returns a diff of results and errors", () => {
      const a = node("id-a", "a = [b, b]");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 3");
      const d = node("id-d", "d = 5");
      const expr1 = node("id-expr1", "b + x");
      const expr2 = node("id-expr2", "c^2");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, c, d, expr1, expr2]);
      evaluator.evaluateAll();
      const x = node("id-x", "x = 1");
      evaluator.graphManager.deleteExpressions([b, c]);
      const b2 = node("id-b", "b = 4");
      evaluator.graphManager.addExpressions([x, b2]);
      const diff = evaluator.evaluateAll();
      expect(diff).toStrictEqual({
        results: {
          added: new Set(["id-x", "id-expr1"]),
          updated: new Set(["id-b", "id-a"]),
          deleted: new Set(["id-c", "id-expr2"]),
          unchanged: new Set(["id-d"]),
        },
        errors: {
          added: new Set(["id-expr2"]),
          updated: new Set([]),
          deleted: new Set(["id-expr1"]),
          unchanged: new Set([]),
        },
      });
    });
  });

  describe("#evaluate(sources)", () => {
    it.skip("re-evaluates only the reachable subgraph", () => {
      const a = node("id-a", "a = [b, b]");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 3");
      const d = node("id-d", "d = 5");
      const x = node("id-x", "x = 30");
      const exp1 = node("id-exp1", "b + c + x");
      const exp2 = node("id-exp2", "d^2");
      const exp3 = node("id-exp3", "w^2");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, c, d, x, exp1, exp2, exp3]);
      evaluator.evaluateAll();

      evaluator.graphManager.deleteExpressions([c]);
      const c2 = node("id-c", "c=4");
      evaluator.graphManager.addExpressions([c2]);

      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": [2, 2],
          "id-b": 2,
          "id-c": 3,
          "id-d": 5,
          "id-x": 30,
          "id-exp1": 35,
          "id-exp2": 25,
        })
      );
      const a1 = evaluator.results.get("id-a");
      expect(a1).toStrictEqual([2, 2]);

      const diff = evaluator.evaluateAll([c2]);
      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": [2, 2],
          "id-b": 2,
          "id-c": 4,
          "id-d": 5,
          "id-x": 30,
          "id-exp1": 36,
          "id-exp2": 25,
        })
      );
      expect(diff).toStrictEqual({
        results: {
          added: new Set([]),
          updated: new Set(["id-c", "id-exp1"]),
          deleted: new Set([]),
          unchanged: new Set(["id-a", "id-b", "id-d", "id-x", "id-exp2"]),
        },
        errors: {
          added: new Set([]),
          updated: new Set([]),
          deleted: new Set([]),
          unchanged: new Set(["id-exp3"]),
        },
      });

      const a2 = evaluator.results.get("id-a");
      expect(a2).toStrictEqual([2, 2]);

      // Since 'id-a' was not part of the re-evaluated subgraph, it should be
      // equal-by-reference.
      expect(a1).toBe(a2);
    });
  });
});
