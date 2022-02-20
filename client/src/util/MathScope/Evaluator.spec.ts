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
      evaluator.evaluate();
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
      evaluator.evaluate();
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
      evaluator.evaluate();
      expect(evaluator.results).toStrictEqual(asMap({}));
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-f": new UnmetDepErr(["a", "b"]),
        })
      );
    });

    it.only("returns a diff of results and errors", () => {
      const a = node("id-a", "a = [b, b]");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 3");
      const d = node("id-d", "d = 5");
      const expr1 = node("id-expr1", "b + x");
      const expr2 = node("id-expr2", "c^2");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, c, d, expr1, expr2]);
      evaluator.evaluate();
      const x = node("id-x", "x = 1");
      evaluator.graphManager.deleteExpressions([b, c]);
      const b2 = node("id-b", "b = 4");
      evaluator.graphManager.addExpressions([x, b2]);
      const diff = evaluator.evaluate();
      console.log(evaluator.results);
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

  describe("#evaluate(sources)", () => {});
});
