import { expect, describe, it } from "vitest";
import { toNearlyEqual } from "@math3d/test-utils";
import type { CustomMatchers, ToNearlyEqualOptions } from "@math3d/test-utils";
import math from "./mathjs";

declare module "vitest" {
  interface Assertion extends CustomMatchers {}
}

// For comparing approximate equality of arrays, functions, objects.
// For numbers, this uses a default tolerance of 1e-4
expect.extend({
  toNearlyEqual: (received, expected, opts: Partial<ToNearlyEqualOptions>) =>
    toNearlyEqual(received, expected, {
      digitsToCompare: 4,
      range: [-1, 1],
      ...opts,
    }),
});

type FuncR1_R3 = (x: number) => [number, number, number];
type FuncR3_R1 = (x: number, y: number, z: number) => number;
type FuncR3_R3 = (x: number, y: number, z: number) => [number, number, number];
type FuncR2_R2R3 = (
  x: number,
  y: number,
) => [[number, number, number], [number, number, number]];
type FuncR2_R3 = (u: number, v: number) => [number, number, number];

describe("diff", () => {
  it("differentiates js-defined functions R^1 => R^1", () => {
    const f = (x: number) => x ** 3 + x + 2;
    const manualDf = (x: number) => 3 * x ** 2 + 1;

    // If given a function, diff returns a function:
    const df = math.evaluate("diff(f)", { f });
    expect(typeof df).toBe("function");
    expect(df).toHaveLength(1);

    expect(df).toNearlyEqual(manualDf);

    // If given a function and values, diff evaluates:
    const evalDf = (x: number) => math.evaluate("diff(f, x)", { f, x });
    expect(evalDf).toNearlyEqual(manualDf);
  });

  it("differentiates js-defined functions R^3 => R^1", () => {
    const f: FuncR3_R1 = (x, y, z) =>
      y * x ** 3 + x * y * z ** 2 + 2 * x ** 2 + y ** 2 + z ** 2;
    const manualDf: FuncR3_R3 = (x, y, z) => [
      3 * y * x ** 2 + y * z ** 2 + 4 * x,
      x ** 3 + x * z ** 2 + 2 * y,
      2 * x * y * z + 2 * z,
    ];

    // If given a function, diff returns a function:
    const df = math.evaluate("diff(f)", { f });
    expect(typeof df).toBe("function");
    expect(df).toHaveLength(3);
    expect(df).toNearlyEqual(manualDf, { digitsToCompare: 2 });

    // If given a function and values, diff evaluates:
    const evalDf: FuncR3_R1 = (x, y, z) =>
      math.evaluate("diff(f, x, y, z)", { f, x, y, z });
    expect(evalDf).toNearlyEqual(manualDf, { digitsToCompare: 2 });
  });

  it("differentiates js-defined functions R^2 => R^3", () => {
    const f: FuncR2_R3 = (u, v) => [u ** 2 * v, u * v ** 2, u ** 2 + u * v];
    const manualDf: FuncR2_R2R3 = (u, v) => [
      [2 * u * v, v ** 2, 2 * u + v],
      [u ** 2, 2 * u * v, u],
    ];

    // If given a function, diff returns a function:
    const df = math.evaluate("diff(f)", { f });
    expect(typeof df).toBe("function");
    expect(df).toHaveLength(2);
    expect(df).toNearlyEqual(manualDf, { digitsToCompare: 3 });

    // If given a function and values, diff evaluates:
    const evalDf: FuncR2_R2R3 = (u, v) =>
      math.evaluate("diff(f, u, v)", { f, u, v });
    expect(evalDf).toNearlyEqual(manualDf, { digitsToCompare: 3 });
  });
});

describe("unitT", () => {
  it("is correct in special case", () => {
    const f: FuncR1_R3 = (t) => [t, (2 / 3) * t ** 3, t ** 2];
    const manualUnitT: FuncR1_R3 = (t) => [
      1 / (1 + 2 * t ** 2),
      (2 * t ** 2) / (1 + 2 * t ** 2),
      (2 * t) / (1 + 2 * t ** 2),
    ];
    expect((t: number) => math.evaluate("unitT(f, t)", { f, t })).toNearlyEqual(
      manualUnitT,
    );
  });
});

describe("unitN", () => {
  it("is correct in special case", () => {
    const f: FuncR1_R3 = (t) => [t, (2 / 3) * t ** 3, t ** 2];
    const manualUnitN: FuncR1_R3 = (t) => [
      -((2 * t) / (1 + 2 * t ** 2)),
      (2 * t) / (1 + 2 * t ** 2),
      -1 + 2 / (1 + 2 * t ** 2),
    ];
    expect((t: number) => math.evaluate("unitN(f, t)", { f, t })).toNearlyEqual(
      manualUnitN,
    );
  });
});

describe("unitB", () => {
  it("is correct in special case", () => {
    const f: FuncR1_R3 = (t) => [t, (2 / 3) * t ** 3, t ** 2];
    const manualUnitB: FuncR1_R3 = (t) => [
      -1 + 1 / (1 + 2 * t ** 2),
      1 / (-1 - 2 * t ** 2),
      (2 * t) / (1 + 2 * t ** 2),
    ];
    expect((t: number) => math.evaluate("unitB(f, t)", { f, t })).toNearlyEqual(
      manualUnitB,
    );
  });
});
