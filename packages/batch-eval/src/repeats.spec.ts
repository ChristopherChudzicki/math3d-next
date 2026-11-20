import { describe, expect, onTestFinished, test, vi } from "vitest";
import { batchOf } from "./registry";
import { define, mismatches, runForm } from "./testForms";
import type { Fn } from "./testForms";

/** Every point of a grid with `axis` on each of `params` axes, first axis fastest. */
const grid = (axis: number[], params: number): number[][] => {
  const count = axis.length ** params;
  return Array.from({ length: params }, (_p, p) =>
    Array.from(
      { length: count },
      (_x, i) => axis[Math.floor(i / axis.length ** p) % axis.length],
    ),
  );
};

// Finite at both ends: a NaN result there would hide a wrong entry at the
// edge of a tile or run.
const AXIS = [-2.5, NaN, -1, -0, 0, Infinity, 0.3, 1, 7.25];

const expectMatches = (f: Fn, columns = grid(AXIS, batchOf(f)!.params)) =>
  expect(mismatches(f, columns)).toEqual([]);

describe("columns that repeat give the numbers the function gives", () => {
  test.each([
    "f(x, y, z) = sin(2 x) cos(y) + sin(y) cos(z) + sin(z) cos(x)",
    "f(x, y) = sin(x) * (y^2 + sin(y) - exp(y * sin(y)))",
    "f(x, y) = sin(x)",
  ])("on a grid: %s", (expr) => {
    expectMatches(define(expr));
  });

  test("on one slab of a grid, where the last column is constant", () => {
    const [xs, ys] = grid(AXIS, 2);
    const f = define("f(x, y, z) = sin(x) cos(y) + cos(z) * x + z");
    expectMatches(f, [xs, ys, xs.map(() => 0.3)]);
  });

  test("through a user function, and around one", () => {
    const scope = {
      g: define("g(a, b) = sin(a) * cos(b)"),
      same: define("same(a) = a"),
      three: define("three(a) = 3"),
    };
    expectMatches(
      define(
        "f(x, y) = g(x, y) + g(y, 2) * same(x) + x * same(y) + three(x) * y",
        scope,
      ),
    );
  });

  test("when the last tile and the last run are cut short", () => {
    const f = define("f(x, y) = sin(x) + cos(y)");
    expectMatches(f, [
      [1, 2, 3, 1, 2, 3, 1, 2],
      [5, 5, 5, 6, 6, 6, 7, 7],
    ]);
  });

  test("when one entry breaks the pattern", () => {
    const f = define("f(x, y) = sin(x) + cos(y)");
    expectMatches(f, [
      [1, 2, 3, 1, 2, 3, 1, 9],
      [5, 5, 5, 6, 6, 9, 7, 7],
    ]);
  });

  test("0 and -0 are different values", () => {
    const f = define("f(x, y) = sin(x) * y");
    const result = runForm(f, [
      [0, -0, 0, 0],
      [1, 1, 1, 1],
    ]);
    expect(Array.from(result!)).toEqual([0, -0, 0, 0]);
  });

  test("after a run that declined", () => {
    const f = define("f(x, y) = x * sqrt(y)");
    expect(runForm(f, grid([4, -1], 2))).toBeUndefined();
    expectMatches(f, grid([4, 9, 16], 2));
  });
});

describe("how often a subexpression of one parameter runs", () => {
  const counted = () => vi.fn((x: number) => x + 1);
  const AXIS_4 = [1, 2, 3, 4];

  test("once per entry of the period of a column that tiles", () => {
    const g = counted();
    runForm(define("f(x, y) = (g(x * x) + 1) * y", { g }), grid(AXIS_4, 2));
    expect(g).toHaveBeenCalledTimes(4);
  });

  test("once per run of a column that comes in runs", () => {
    const g = counted();
    runForm(define("f(x, y) = x * g(y)", { g }), grid(AXIS_4, 2));
    expect(g).toHaveBeenCalledTimes(4);
  });

  test("once for a constant column", () => {
    const g = counted();
    runForm(define("f(x, z) = x + g(z)", { g }), [AXIS_4, [7, 7, 7, 7]]);
    expect(g).toHaveBeenCalledTimes(1);
  });

  test("when it is the whole function", () => {
    const g = counted();
    runForm(define("f(x, y) = g(x)", { g }), grid(AXIS_4, 2));
    expect(g).toHaveBeenCalledTimes(4);
  });

  test("when it is a function with a loop of its own", () => {
    const sin = vi.spyOn(Math, "sin");
    onTestFinished(() => sin.mockRestore());
    runForm(define("f(x, y) = sin(x) * y"), grid(AXIS_4, 2));
    expect(sin).toHaveBeenCalledTimes(4);
  });

  test("every sample when the column doesn't repeat", () => {
    const g = counted();
    const broken = [1, 2, 3, 1, 2, 3, 1, 9];
    runForm(define("f(x, y) = g(x) * y", { g }), [broken, broken]);
    expect(g).toHaveBeenCalledTimes(8);
  });

  test("every sample for a function of one parameter", () => {
    const g = counted();
    runForm(define("f(x) = g(x)", { g }), [[1, 2, 1, 2]]);
    expect(g).toHaveBeenCalledTimes(4);
  });
});
