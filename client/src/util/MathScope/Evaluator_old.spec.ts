import { MathNode, parse } from "mathjs";
import Evaluator from "./Evaluator_old";

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

  it("evaluates the given nodes, exposing result on Evaluator.result", () => {
    const a = node("id-a", "a = b^2");
    const b = node("id-b", "b = 2");
    const expr1 = node("id-1", "a + b");
    const nodes = [a, b, expr1];
    const evaluator = new Evaluator(nodes);
    expect(evaluator.result).toStrictEqual(
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
    expect(evaluator.result).toStrictEqual(
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
    expect(evaluator.result).toStrictEqual(
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
    it("updates the result map appropriately", () => {
      const a = node("id-a", "a = b^2");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 5");
      const expr1 = node("id-1", "2*c");
      const expr2 = node("id-2", "b/2");
      const expr3 = node("id-3", "h(c)");
      const nodes = [a, b, c, expr1, expr2, expr3];
      const initialScope = asMap({ h: (x: number) => x ** 2 });
      const evaluator = new Evaluator(nodes, initialScope);
      const originalResult = {
        "id-a": 4,
        "id-b": 2,
        "id-c": 5,
        "id-1": 10,
        "id-2": 1,
        "id-3": 25,
      };
      expect(evaluator.result).toStrictEqual(asMap(originalResult));

      evaluator.updateLiteralConstant("id-b", 6);

      expect(evaluator.result).toStrictEqual(
        asMap({
          ...originalResult,
          "id-b": 6,
          "id-a": 36,
          "id-2": 3,
        })
      );
    });

    it("only re-evaluates dependents of the updated literal", () => {
      const a = node("id-a", "a = b^2");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 5");
      const expr1 = node("id-1", "2*c");
      const expr2 = node("id-2", "b/2");
      const expr3 = node("id-3", "h(c)");
      const nodes = [a, b, c, expr1, expr2, expr3];
      const initialScope = asMap({ h: (x: number) => x ** 2 });

      const spies: Map<MathNode, jest.SpyInstance> = new Map();
      nodes.forEach((thisNode) => {
        const originalCompile = thisNode.compile;
        // eslint-disable-next-line no-param-reassign
        thisNode.compile = () => {
          const compiled = originalCompile.call(thisNode);
          const spy = jest.spyOn(compiled, "evaluate");
          spies.set(thisNode, spy);
          return compiled;
        };
      });

      const evaluator = new Evaluator(nodes, initialScope);
      expect(spies.get(a)).toHaveBeenCalledTimes(1);
      expect(spies.get(b)).toHaveBeenCalledTimes(1);
      expect(spies.get(c)).toHaveBeenCalledTimes(1);
      expect(spies.get(expr1)).toHaveBeenCalledTimes(1);
      expect(spies.get(expr2)).toHaveBeenCalledTimes(1);
      expect(spies.get(expr3)).toHaveBeenCalledTimes(1);

      evaluator.updateLiteralConstant("id-b", 6);
      expect(spies.get(a)).toHaveBeenCalledTimes(2);
      expect(spies.get(b)).toHaveBeenCalledTimes(1);
      expect(spies.get(c)).toHaveBeenCalledTimes(1);
      expect(spies.get(expr1)).toHaveBeenCalledTimes(1);
      expect(spies.get(expr2)).toHaveBeenCalledTimes(2);
      expect(spies.get(expr3)).toHaveBeenCalledTimes(1);
    });

    it("returns the set of updated nodeIds", () => {
      const a = node("id-a", "a = b^2");
      const b = node("id-b", "b = 2");
      const c = node("id-c", "c = 5");
      const expr1 = node("id-1", "2*c");
      const expr2 = node("id-2", "b/2");
      const expr3 = node("id-3", "h(c)");
      const nodes = [a, b, c, expr1, expr2, expr3];
      const initialScope = asMap({ h: (x: number) => x ** 2 });

      const evaluator = new Evaluator(nodes, initialScope);
      const updated = evaluator.updateLiteralConstant("id-b", 6);
      const resultUpdates = new Set(["id-b", "id-a", "id-2"]);
      const errorUpdates = new Set();
      expect(updated).toStrictEqual({ resultUpdates, errorUpdates });
    });
  });
});
