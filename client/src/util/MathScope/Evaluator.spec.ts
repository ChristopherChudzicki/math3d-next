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
      evaluator.enqueueAddExpressions([a, b, expr1]);
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
      evaluator.enqueueAddExpressions([a, b, c, expr1]);
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
      evaluator.enqueueAddExpressions([f]);
      evaluator.evaluate();
      expect(evaluator.results).toStrictEqual(asMap({}));
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-f": new UnmetDepErr(["a", "b"]),
        })
      );
    });

    it("can add and remove nodes", () => {
      const a = node("id-a", "a = [b, b]");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 3");
      const d = node("id-d", "d = 5");
      const expr1 = node("id-expr1", "[b, b, x]");
      const expr2 = node("id-expr2", "c^2");
      const evaluator = new Evaluator();
      evaluator.enqueueAddExpressions([a, b, c, d, expr1, expr2]);
      evaluator.evaluate();
      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": [2, 2],
          "id-b": 2,
          "id-c": 3,
          "id-d": 5,
          "id-expr2": 9,
        })
      );
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-expr1": new UnmetDepErr(["x"]),
        })
      );

      const x = node("id-x", "x = 1");
      const b2 = node("id-b", "b = 4");
      evaluator.enqueueDeleteExpressions([b, c]);
      evaluator.enqueueAddExpressions([x, b2]);

      const diff = evaluator.evaluate();

      expect(evaluator.results).toStrictEqual(
        asMap({
          "id-a": [4, 4],
          "id-b": 4,
          "id-d": 5,
          "id-x": 1,
          "id-expr1": [4, 4, 1],
        })
      );
      expect(evaluator.errors).toStrictEqual(
        asMap({
          "id-expr2": new UnmetDepErr(["c"]),
        })
      );

      expect(diff).toStrictEqual({
        results: {
          added: new Set(["id-x", "id-expr1"]),
          updated: new Set(["id-b", "id-a"]),
          deleted: new Set(["id-c", "id-expr2"]),
        },
        errors: {
          added: new Set(["id-expr2"]),
          updated: new Set([]),
          deleted: new Set(["id-expr1"]),
        },
      });
    });

    it("only re-evaluates the affected portion of results", () => {
      const a = node("id-a", "a = [b, b]");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 3");
      const d = node("id-d", "d = 5");
      const x = node("id-x", "x = 30");
      const exp1 = node("id-exp1", "b + c + x");
      const exp2 = node("id-exp2", "d^2");
      const exp3 = node("id-exp3", "w^2");
      const evaluator = new Evaluator();
      evaluator.enqueueAddExpressions([a, b, c, d, x, exp1, exp2, exp3]);
      evaluator.evaluate();

      const c2 = node("id-c", "c=4");
      evaluator.enqueueDeleteExpressions([c]);
      evaluator.enqueueAddExpressions([c2]);

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

      const diff = evaluator.evaluate();
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
        },
        errors: {
          added: new Set([]),
          updated: new Set([]),
          deleted: new Set([]),
        },
      });

      const a2 = evaluator.results.get("id-a");
      expect(a2).toStrictEqual([2, 2]);

      // Since 'id-a' was not part of the re-evaluated subgraph, it should be
      // equal-by-reference.
      expect(a1).toBe(a2);
    });
  });

  describe("enqueueAddExpressions", () => {
    it("throws an error if duplicate ids are in the same batch", () => {
      const evaluator = new Evaluator();
      const shouldThrow1 = () => {
        const [a1, a2] = [node("a", "a = 1"), node("a", "a = 2")];
        evaluator.enqueueAddExpressions([a1, a2]);
      };

      expect(shouldThrow1).toThrow(/id "a" is already in use/);
    });

    it("throws an error if duplicate ids are in different batches", () => {
      const evaluator = new Evaluator();
      const shouldThrow2 = () => {
        const [a1, a2] = [node("a", "a = 1"), node("a", "a = 2")];
        evaluator.enqueueAddExpressions([a1]);
        evaluator.enqueueAddExpressions([a2]);
      };
      expect(shouldThrow2).toThrow(/id "a" is already in use/);
    });

    it("does not throw if the id is removed before being added again", () => {
      const evaluator = new Evaluator();
      const shouldNotThrow = () => {
        const [a1, a2] = [node("a", "a = 1"), node("a", "a = 2")];
        evaluator.enqueueAddExpressions([a1]);
        evaluator.enqueueDeleteExpressions([a1]);
        evaluator.enqueueAddExpressions([a2]);
      };
      expect(shouldNotThrow).not.toThrow();
    });
  });
});
