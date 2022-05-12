import MathScope, {
  ScopeChangeErrorsEvent,
  ScopeChangeEvent,
} from "./MathScope";

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

describe('MathScope "change" Events', () => {
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
    const spy1 = jest.fn();
    const spy2 = jest.fn();

    mathScope.addEventListener("change", spy1);
    mathScope.addEventListener("change", spy2);
    mathScope.setExpressions([]);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    mathScope.removeEventListener("change", spy1);
    mathScope.setExpressions([]);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(2);
  });
});

describe('MathScope "change-errors" Events', () => {
  test("Adding without errors does not trigger the event", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.setExpressions([
      { id: "c", expr: "2 * 20" },
      { id: "b", expr: "a + 2 " },
    ]);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  test("Adding with errors does trigger the event", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.setExpressions([{ id: "c", expr: "x + 1" }]);

    const event: ScopeChangeErrorsEvent = {
      type: "change-errors",
      mathScope,
      changes: {
        errors: {
          added: new Set("c"),
          deleted: new Set(),
          updated: new Set(),
          touched: new Set(["c"]),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(event);
  });

  test("Deleting without errors does not trigger the event", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change-errors", spy);
    mathScope.deleteExpressions(["b"]);

    expect(spy).toHaveBeenCalledTimes(0);
  });

  test("Deleting with errors does trigger the event", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
    ]);

    const spy = jest.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.deleteExpressions(["a"]);

    const event: ScopeChangeErrorsEvent = {
      type: "change-errors",
      mathScope,
      changes: {
        errors: {
          added: new Set("b"),
          deleted: new Set(),
          updated: new Set(),
          touched: new Set(["b"]),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(event);
  });

  test("Removing event listeners", () => {
    const mathScope = new MathScope();
    mathScope.setExpressions([
      { id: "a", expr: "a = 4" },
      { id: "b", expr: "a + 1" },
      { id: "x", expr: "x = 4" },
      { id: "y", expr: "x + 1" },
    ]);

    const spy1 = jest.fn();
    const spy2 = jest.fn();
    mathScope.addEventListener("change-errors", spy1);
    mathScope.addEventListener("change-errors", spy2);

    mathScope.deleteExpressions(["a"]);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    mathScope.removeEventListener("change-errors", spy1);
    mathScope.deleteExpressions(["x"]);
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(2);
  });
});
