import { mathWithTransform, typed } from "@math3d/custom-mathjs";
import { describe, expect, test } from "vitest";
import * as kernels from "./kernels";
import type { Kernel1, Kernel2 } from "./kernels";
import { createPool } from "./pool";
import { randomDoubles, SPECIAL } from "./testColumns";
import type { Column } from "./types";

type NumberFn = (...args: number[]) => number;

/** mathjs's own implementation of `name` for number operands. */
const numberFn = (name: string, arity: number) =>
  typed.resolve(mathWithTransform[name], Array(arity).fill(0))!
    .implementation as NumberFn;

/** Every pair of special values, then pairs of random doubles. */
const pairs = (): [number[], number[]] => {
  const xs = SPECIAL.flatMap((x) => SPECIAL.map(() => x));
  const ys = SPECIAL.flatMap(() => SPECIAL);
  return [
    [...xs, ...randomDoubles(200, 1)],
    [...ys, ...randomDoubles(200, 2)],
  ];
};

const singles = () => [...SPECIAL, ...randomDoubles(200, 3)];

const run = (evaluate: (pool: ReturnType<typeof createPool>) => Column) => {
  const pool = createPool();
  return (count: number) => {
    pool.reset(count);
    return evaluate(pool);
  };
};

const expectSame = (actual: Column, expected: number[]) => {
  expect(actual).toBeInstanceOf(Float64Array);
  const mismatches = expected.flatMap((value, i) =>
    Object.is((actual as Float64Array)[i], value)
      ? []
      : [{ i, actual: (actual as Float64Array)[i], expected: value }],
  );
  expect(mismatches).toEqual([]);
};

describe.each(["add", "subtract", "multiply", "divide"] as const)(
  "%s",
  (name) => {
    const kernel: Kernel2 = kernels[name];
    const reference = numberFn(name, 2);
    const [xs, ys] = pairs();

    test("two arrays", () => {
      const a = Float64Array.from(xs);
      const b = Float64Array.from(ys);
      const result = run((pool) => kernel(xs.length, a, b, pool))(xs.length);
      expectSame(
        result,
        xs.map((x, i) => reference(x, ys[i])),
      );
      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
    });

    test.each(SPECIAL)("a number (%s) and an array", (x) => {
      const b = Float64Array.from(ys);
      expectSame(
        run((pool) => kernel(ys.length, x, b, pool))(ys.length),
        ys.map((y) => reference(x, y)),
      );
    });

    test.each(SPECIAL)("an array and a number (%s)", (y) => {
      const a = Float64Array.from(xs);
      expectSame(
        run((pool) => kernel(xs.length, a, y, pool))(xs.length),
        xs.map((x) => reference(x, y)),
      );
    });

    test("two numbers give a number", () => {
      const result = run((pool) => kernel(4, 6, -1.5, pool))(4);
      expect(result).toBe(reference(6, -1.5));
    });
  },
);

describe.each(["unaryMinus", "unaryPlus"] as const)("%s", (name) => {
  const kernel: Kernel1 = kernels[name];
  const reference = numberFn(name, 1);

  test("an array", () => {
    const xs = singles();
    const a = Float64Array.from(xs);
    const result = run((pool) => kernel(xs.length, a, pool))(xs.length);
    expectSame(
      result,
      xs.map((x) => reference(x)),
    );
    expect(result).not.toBe(a);
  });

  test("a number gives a number", () => {
    expect(run((pool) => kernel(4, -0, pool))(4)).toBe(reference(-0));
  });
});

describe("powInt", () => {
  const reference = numberFn("pow", 2);

  test.each([2, 3, -1, 0, 4])("an array to the power %s", (n) => {
    const xs = singles();
    const a = Float64Array.from(xs);
    const result = run((pool) => kernels.powInt(n)(xs.length, a, pool))(
      xs.length,
    );
    expectSame(
      result,
      xs.map((x) => reference(x, n)),
    );
    expect(result).not.toBe(a);
  });

  test("a number gives a number", () => {
    expect(run((pool) => kernels.powInt(3)(4, 1.1, pool))(4)).toBe(
      reference(1.1, 3),
    );
  });
});
