import { describe, it, expect, test, vi } from "vitest";
import * as math from "mathjs";
import { Diff } from "./interfaces";
import MathScope, {
  ScopeChangeErrorsEvent,
  ScopeChangeEvent,
} from "./MathScope";
import { SimplerMathJsParser } from "./adapter";
import type { Parseable } from "./adapter";
import {
  CyclicAssignmentError,
  DuplicateAssignmentError,
  UnmetDependencyError,
} from "./Evaluator";

const { parse } = new SimplerMathJsParser(math);

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
      ]),
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
      ]),
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
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: event }),
    );
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
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: event }),
    );
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
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: event1 }),
    );

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
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: event2 }),
    );

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
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: event3 }),
    );
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
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: event }),
    );
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
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ detail: event }),
    );
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

test("an unmet dependency error lists the undefined names", () => {
  expect(new UnmetDependencyError(["b", "a"]).message).toBe(
    "Undefined symbols a, b",
  );
});

test("an assignment that uses an undefined name is an unmet dependency", () => {
  const scope = new MathScope<Parseable>({ parse });
  scope.setExpressions([{ id: "b", parseable: "b = a + 1" }]);
  expect(scope.errors.get("b")).toBeInstanceOf(UnmetDependencyError);
});

test("underscore names added in one batch are duplicates once something uses them", () => {
  const scope = new MathScope<Parseable>({ parse });
  scope.setExpressions([
    { id: "a", parseable: "_k = 1" },
    { id: "b", parseable: "_k = 3" },
    { id: "use", parseable: "_k + 1" },
  ]);
  expect(scope.errors.get("a")).toBeInstanceOf(DuplicateAssignmentError);
  expect(scope.errors.get("b")).toBeInstanceOf(DuplicateAssignmentError);
});

describe("overridable definitions", () => {
  const getScope = () =>
    new MathScope<Parseable>({
      parse,
      isOverridable: (id) => id.startsWith("app:"),
    });
  const appK = { id: "app:k", parseable: "k = 1" };
  const use = { id: "use", parseable: "k + 1" };

  test("an app definition is used when nothing overrides it", () => {
    const scope = getScope();
    scope.setExpressions([appK, use]);
    expect(scope.results.get("use")).toBe(2);
  });

  test("a user definition of the same name wins, with no errors", () => {
    const scope = getScope();
    scope.setExpressions([appK, use]);
    scope.setExpressions([{ id: "user:k", parseable: "k = 10" }]);
    expect(scope.results.get("use")).toBe(11);
    expect(scope.errors).toStrictEqual(new Map());
    expect(scope.results.has("app:k")).toBe(false);
  });

  test("deleting the user definition restores the app's", () => {
    const scope = getScope();
    scope.setExpressions([appK, use, { id: "user:k", parseable: "k = 10" }]);
    scope.deleteExpressions(["user:k"]);
    expect(scope.results.get("use")).toBe(2);
  });

  test("the user definition wins whichever is added first", () => {
    const scope = getScope();
    scope.setExpressions([{ id: "user:k", parseable: "k = 10" }, use]);
    scope.setExpressions([appK]);
    expect(scope.results.get("use")).toBe(11);
  });

  test("a shadowed app definition re-evaluating leaves the user's value", () => {
    const scope = getScope();
    scope.setExpressions([
      { id: "j", parseable: "j = 1" },
      { id: "app:k", parseable: "k = j" },
      use,
      { id: "user:k", parseable: "k = 10" },
    ]);
    scope.setExpressions([{ id: "j", parseable: "j = 5" }]);
    expect(scope.results.get("use")).toBe(11);
  });

  test("two user definitions are still duplicates", () => {
    const scope = getScope();
    scope.setExpressions([
      appK,
      use,
      { id: "user:k1", parseable: "k = 10" },
      { id: "user:k2", parseable: "k = 20" },
    ]);
    expect(scope.errors.get("user:k1")).toBeInstanceOf(
      DuplicateAssignmentError,
    );
    expect(scope.errors.get("user:k2")).toBeInstanceOf(
      DuplicateAssignmentError,
    );
    expect(scope.errors.has("use")).toBe(true);
  });

  test("a cycle through a user definition is cyclic, not duplicate", () => {
    const scope = getScope();
    scope.setExpressions([
      appK,
      { id: "user:f", parseable: "f(t) = t + k" },
      { id: "user:k", parseable: "k = f(1)" },
    ]);
    expect(scope.errors.get("user:f")).toBeInstanceOf(CyclicAssignmentError);
    expect(scope.errors.get("user:k")).toBeInstanceOf(CyclicAssignmentError);
    expect(scope.errors.has("app:k")).toBe(false);
  });

  test("deleting a shadowed app definition keeps the user's value", () => {
    const scope = getScope();
    scope.setExpressions([appK, use, { id: "user:k", parseable: "k = 10" }]);
    scope.deleteExpressions(["app:k"]);
    expect(scope.results.get("use")).toBe(11);
  });

  test("an unparseable user definition doesn't hide the app's", () => {
    const scope = getScope();
    scope.setExpressions([appK, use, { id: "user:k", parseable: "k(t = " }]);
    expect(scope.results.get("use")).toBe(2);
    expect(scope.errors.has("user:k")).toBe(true);
  });
});
