import { parse } from "mathjs";
import Evaluator from "./Evaluator";

const node = (id: string, parseable: string) => {
  const parsed = parse(parseable);
  parsed.comment = id;
  return parsed;
};

const scope = (obj: Record<string, unknown>) => new Map(Object.entries(obj));

describe("evaluator", () => {
  it("instantiates with an array of identified nodes and initial scope", () => {
    const a = node("sym-a", "a = 2");
    const f = node("func-f", "f(x) = x^2");
    const anon = node("anon", "f(a + b)");
    const identifiedNodes = [a, f, anon];
    const initialScope = scope({ b: 4 });

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
      scope({
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
    const initialScope = scope({ b: 2 });
    const evaluator = new Evaluator(nodes, initialScope);
    expect(evaluator.results).toStrictEqual(
      scope({
        "id-a": 4,
        "id-1": 6,
      })
    );
  });
});
