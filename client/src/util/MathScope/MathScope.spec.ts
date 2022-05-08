import MathScope, { ScopeChangeEvent } from "./MathScope";

describe("MathScope Setting Expressions", () => {
  it("Adds expressions and exposes results + errors", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "b", expr: "b = a^2" },
      { id: "x", expr: "x = y" },
    ]);
    mathScope.setExpressions([
      { id: "a", expr: "a = 3" },
      { id: "c", expr: "a + b" },
    ]);

    expect(mathScope.results).toStrictEqual(
      new Map([
        ["a", 3],
        ["b", 9],
        ["c", 12],
      ])
    );

    expect(mathScope.errors).toStrictEqual(new Map([["x", expect.any(Error)]]));
  });

  it("Removes expressions", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
      { id: "c", expr: "2 * 10" },
    ]);

    expect(mathScope.results).toStrictEqual(
      new Map([
        ["a", 4],
        ["b", 5],
        ["c", 20],
      ])
    );
    expect(mathScope.errors).toStrictEqual(new Map());

    mathScope.deleteExpressions(["a"]);

    expect(new Set(mathScope.results.keys())).toStrictEqual(new Set(["c"]));
    expect(new Set(mathScope.errors.keys())).toStrictEqual(new Set(["b"]));
  });
});

describe("MathScope Change Events", () => {
  test("Setting expressions triggers a change", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change", spy);

    mathScope.setExpressions([
      { id: "c", expr: "2 * 20" },
      { id: "b", expr: "a + 2 " },
    ]);
    const event: ScopeChangeEvent = {
      type: "change",
      mathScope,
      changes: {
        results: {
          added: new Set(["c"]),
          deleted: new Set(),
          updated: new Set(["b"]),
          touched: new Set(["b", "c"]),
        },
        errors: {
          added: new Set(),
          deleted: new Set(),
          updated: new Set(),
          touched: new Set(),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(event);
  });

  test("Deleting expressions triggers a change", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change", spy);

    mathScope.deleteExpressions(["b"]);
    const event: ScopeChangeEvent = {
      type: "change",
      mathScope,
      changes: {
        results: {
          added: new Set([]),
          deleted: new Set(["b"]),
          updated: new Set([]),
          touched: new Set(["b"]),
        },
        errors: {
          added: new Set(),
          deleted: new Set(),
          updated: new Set(),
          touched: new Set([]),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(event);
  });

  test("Removing event listeners", () => {
    const mathScope = new MathScope();
    const spy = jest.fn();

    mathScope.addEventListener("change", spy);
    mathScope.setExpressions([]);
    mathScope.setExpressions([]);
    expect(spy).toHaveBeenCalledTimes(2);
    mathScope.removeEventListener("change", spy);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
