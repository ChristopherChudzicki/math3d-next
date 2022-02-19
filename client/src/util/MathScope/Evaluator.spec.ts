import { parse } from "mathjs";
import Evaluator from "./Evaluator";

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

    it("returns a diff showing changed results", () => {
      const a = node("id-a", "a = 2*[1,2,3]");
      const b = node("id-b", "b = [1,2,3]");
      const expr1 = node("id-expr1", "a + b +1");
      const evaluator = new Evaluator();
      evaluator.graphManager.addExpressions([a, b, expr1]);
      const diff = evaluator.evaluate();
      console.log(evaluator.results);
    });
  });

  describe("#evaluate(sources)", () => {});
});
