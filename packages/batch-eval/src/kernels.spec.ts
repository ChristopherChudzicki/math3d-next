import { mathWithTransform, typed } from "@math3d/custom-mathjs";
import { describe, expect, test } from "vitest";
import * as kernels from "./kernels";
import type { Kernel1, Kernel2 } from "./kernels";
import { createPool } from "./pool";
import { randomDoubles, SPECIAL } from "./testColumns";
import { Decline } from "./types";
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

    test("a number and an array", () => {
      const b = Float64Array.from(ys);
      expectSame(
        run((pool) => kernel(ys.length, -2.5, b, pool))(ys.length),
        ys.map((y) => reference(-2.5, y)),
      );
    });

    test("an array and a number", () => {
      const a = Float64Array.from(xs);
      expectSame(
        run((pool) => kernel(xs.length, a, -2.5, pool))(xs.length),
        xs.map((x) => reference(x, -2.5)),
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

describe("generic", () => {
  type Fn = (...args: unknown[]) => unknown;
  const fn = (name: string) => mathWithTransform[name] as Fn;
  const xs = randomDoubles(20, 4);
  const ys = randomDoubles(20, 5);
  const zs = randomDoubles(20, 6);
  const runGeneric = (f: Fn, args: Column[], count = xs.length) =>
    run((pool) => kernels.generic(f, args.length)(count, args, pool))(count);

  test("a function of one number, per sample", () => {
    expectSame(
      runGeneric(fn("sin"), [Float64Array.from(xs)]),
      xs.map((x) => Math.sin(x)),
    );
  });

  test("a function of two numbers, with a number and an array", () => {
    expectSame(
      runGeneric(fn("atan2"), [2, Float64Array.from(ys)]),
      ys.map((y) => Math.atan2(2, y)),
    );
    expectSame(
      runGeneric(fn("atan2"), [Float64Array.from(xs), 2]),
      xs.map((x) => Math.atan2(x, 2)),
    );
    expectSame(
      runGeneric(fn("atan2"), [Float64Array.from(xs), Float64Array.from(ys)]),
      xs.map((x, i) => Math.atan2(x, ys[i])),
    );
  });

  test("a function of three numbers", () => {
    expectSame(
      runGeneric(fn("max"), [
        Float64Array.from(xs),
        Float64Array.from(ys),
        Float64Array.from(zs),
      ]),
      xs.map((x, i) => fn("max")(x, ys[i], zs[i]) as number),
    );
  });

  test("a function that isn't mathjs's is called as it is", () => {
    expectSame(
      runGeneric((x) => 10 * (x as number), [Float64Array.from(xs)]),
      xs.map((x) => 10 * x),
    );
  });

  test("only numbers give a number", () => {
    expect(runGeneric(fn("atan2"), [1, 2])).toBe(Math.atan2(1, 2));
  });

  test.each([
    { name: "in an array", args: [Float64Array.from([4, -1])], count: 2 },
    { name: "from numbers alone", args: [-1], count: 1 },
  ])("a result that isn't a number declines ($name)", ({ args, count }) => {
    expect(() => runGeneric(fn("sqrt"), args, count)).toThrow(Decline);
  });
});
