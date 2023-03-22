import { describe, it, expect } from "vitest";
import { toNearlyEqual } from "./nearlyEqual";

expect.extend({
  toNearlyEqual,
});

describe("toNearlyEqual", () => {
  it("Works on plain numbers", () => {
    expect(1).toNearlyEqual(1 + 1e-7);
    expect(1).not.toNearlyEqual(2);
  });

  it("Works on arrays", () => {
    expect([1, 2, 3]).toNearlyEqual([1 + 1e-7, 2 - 1e-7, 3 + 2e-7]);
    expect([1, 2, 3]).not.toNearlyEqual([1, 2, 4]);
  });

  it("works on nested arrays", () => {
    expect([
      [1, 2],
      [3, 4],
    ]).toNearlyEqual([
      [1 + 1e-7, 2 - 1e-7],
      [3 + 2e-7, 4],
    ]);
    expect([
      [1, 2],
      [3, 4],
    ]).not.toNearlyEqual([
      [1, 2],
      [3, 5],
    ]);
  });

  it("works with functions", () => {
    const f1 = (x: number) => x * x;
    const f2 = (x: number) => x * x + Math.random() * 1e-7;

    const g = (x: number) => x ** 3;

    expect(f1).toNearlyEqual(f2);
    expect(f1).not.toNearlyEqual(g);
  });

  it("Rejects for different types", () => {
    expect(1).not.toNearlyEqual([1]);
  });

  it("accepts a custom tolerance", () => {
    expect(1).toNearlyEqual(1 + 1e-5, { digitsToCompare: 4 });
    expect(1).not.toNearlyEqual(1 + 1e-5, { digitsToCompare: 6 });
  });
});
