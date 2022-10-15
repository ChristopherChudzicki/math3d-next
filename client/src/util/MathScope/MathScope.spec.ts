import { Diff } from "./interfaces";
import MathScope, {
  ScopeChangeErrorsEvent,
  ScopeChangeEvent,
} from "./MathScope";
import { parse } from "./adapter";
import type { Parseable } from "./adapter";

const getMathScope = () => new MathScope({ parse });

const emptyDiff = (): Diff<string> => {
  return {
    added: new Set(),
    deleted: new Set(),
    updated: new Set(),
    touched: new Set(),
  };
};

describe("MathScope Setting Expressions", () => {
  it("Adds expressions and exposes results + errors", () => {
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "b", parseable: "b = a^2" },
      { id: "x", parseable: "x = y" },
    ]);
    mathScope.setExpressions([
      { id: "a", parseable: "a = 3" },
      { id: "c", parseable: "a + b" },
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
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
      { id: "c", parseable: "2 * 10" },
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
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change", spy);

    mathScope.setExpressions([
      { id: "c", parseable: "2 * 20" },
      { id: "b", parseable: "a + 2 " },
    ]);
    const event: ScopeChangeEvent<Parseable> = {
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
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change", spy);

    mathScope.deleteExpressions(["b"]);
    const event: ScopeChangeEvent<Parseable> = {
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
          touched: new Set(),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(event);
  });

  test("Removing event listeners", () => {
    const mathScope = getMathScope();
    const spy1 = vi.fn();
    const spy2 = vi.fn();

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
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.setExpressions([
      { id: "c", parseable: "2 * 20" },
      { id: "b", parseable: "a + 2 " },
    ]);
    expect(spy).toHaveBeenCalledTimes(0);
  });

  test("Adding/updating/deleting with parse errors does trigger change-errors", () => {
    const mathScope = getMathScope();
    const spy = vi.fn();
    mathScope.addEventListener("change-errors", spy);
    mathScope.setExpressions([{ id: "a", parseable: "a = 4 +" }]);

    const event1: ScopeChangeErrorsEvent<Parseable> = {
      type: "change-errors",
      mathScope,
      changes: {
        errors: {
          ...emptyDiff(),
          touched: new Set(["a"]),
          added: new Set(["a"]),
        },
      },
    };
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(event1);

    mathScope.setExpressions([{ id: "a", parseable: "a = 4 + +" }]);
    const event2: ScopeChangeErrorsEvent<Parseable> = {
      type: "change-errors",
      mathScope,
      changes: {
        errors: {
          ...emptyDiff(),
          touched: new Set(["a"]),
          updated: new Set(["a"]),
        },
      },
    };

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(event2);

    mathScope.setExpressions([{ id: "a", parseable: "a = 4" }]);
    const event3: ScopeChangeErrorsEvent<Parseable> = {
      type: "change-errors",
      mathScope,
      changes: {
        errors: {
          ...emptyDiff(),
          touched: new Set(["a"]),
          deleted: new Set(["a"]),
        },
      },
    };

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenLastCalledWith(event3);
  });

  test("Adding with eval errors does trigger the event", () => {
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.setExpressions([{ id: "c", parseable: "x + 1" }]);

    const event: ScopeChangeErrorsEvent<Parseable> = {
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

  test("Deleting without eval errors does not trigger the event", () => {
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change-errors", spy);
    mathScope.deleteExpressions(["b"]);

    expect(spy).toHaveBeenCalledTimes(0);
  });

  test("Deleting with eval errors does trigger the event", () => {
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
    ]);

    const spy = vi.fn();
    mathScope.addEventListener("change-errors", spy);

    mathScope.deleteExpressions(["a"]);

    const event: ScopeChangeErrorsEvent<Parseable> = {
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
    const mathScope = getMathScope();
    mathScope.setExpressions([
      { id: "a", parseable: "a = 4" },
      { id: "b", parseable: "a + 1" },
      { id: "x", parseable: "x = 4" },
      { id: "y", parseable: "x + 1" },
    ]);

    const spy1 = vi.fn();
    const spy2 = vi.fn();
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
