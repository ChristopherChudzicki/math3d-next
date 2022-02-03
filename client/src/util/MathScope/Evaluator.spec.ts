import { parse } from "mathjs";
import Evaluator from "./Evaluator";

const node = (id: string, parseable: string) => {
  const parsed = parse(parseable);
  parsed.comment = id;
  return parsed;
};

const asMap = (obj: Record<string, unknown>) => new Map(Object.entries(obj));

describe("Evaluator", () => {
  it("instantiates with an array of identified nodes and initial scope", () => {
    const a = node("sym-a", "a = 2");
    const f = node("func-f", "f(x) = x^2");
    const anon = node("anon", "f(a + b)");
    const identifiedNodes = [a, f, anon];
    const initialScope = asMap({ b: 4 });

    const evaluator = new Evaluator(identifiedNodes, initialScope);
    expect(evaluator).toBeInstanceOf(Evaluator);
  });

  it("throws an error if one of the given nodes has no comment", () => {
    const a = node("", "a = 2");
    expect(a.comment).toBe("");
    expect(() => new Evaluator([a])).toThrow(
      /unique, non-empty comment serving as its id/g
    );
  });

  it("throws an error if two nodes have the same id", () => {
    const a = node("some-id", "a = 2");
    const b = node("some-id", "a = 2");
    expect(a.comment).toBe(b.comment);
    expect(() => new Evaluator([a, b])).toThrow(
      /unique, non-empty comment serving as its id/g
    );
  });

  it("evaluates the given nodes, exposing results on Evaluator.results", () => {
    const a = node("id-a", "a = b^2");
    const b = node("id-b", "b = 2");
    const expr1 = node("id-1", "a + b");
    const nodes = [a, b, expr1];
    const evaluator = new Evaluator(nodes);
    expect(evaluator.results).toStrictEqual(
      asMap({
        "id-b": 2,
        "id-a": 4,
        "id-1": 6,
      })
    );
  });

  it("uses the initial scope when evaluating", () => {
    const a = node("id-a", "a = b^2");
    const expr1 = node("id-1", "a + b");
    const nodes = [a, expr1];
    const initialScope = asMap({ b: 2 });
    const evaluator = new Evaluator(nodes, initialScope);
    expect(evaluator.results).toStrictEqual(
      asMap({
        "id-a": 4,
        "id-1": 6,
      })
    );
  });

  it("evaluates as much as possible in presence of errors", () => {
    const a = node("id-a", "a = b^2");
    const b = node("id-b", "b = 2");
    const expr1 = node("id-1", "a + b");
    const expr2 = node("id-2", "g(b)");
    const expr3 = node("id-3", "h(a)");
    const nodes = [a, b, expr1, expr2, expr3];
    const initialScope = asMap({ h: (x: number) => x ** 2 });
    const evaluator = new Evaluator(nodes, initialScope);
    expect(evaluator.results).toStrictEqual(
      asMap({
        "id-a": 4,
        "id-b": 2,
        "id-1": 6,
        "id-3": 16,
      })
    );

    expect(evaluator.errors).toStrictEqual(
      asMap({
        "id-2": Error("Undefined function g"),
      })
    );
  });

  describe("updateLiteralConstant", () => {
    it("updates the results map appropriately", () => {
      expect("chris finish this test").toBe("soon");
    });

    it("only re-evaluates dependents of the updated literal", () => {
      expect("chris finish this test").toBe("soon");
    });
  });
});
