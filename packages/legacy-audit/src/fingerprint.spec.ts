import { describe, expect, it } from "vitest";
import math from "@math3d/custom-mathjs";
import { fingerprint, POINTS } from "./fingerprint";

describe("fingerprint", () => {
  it.each([
    [2.5, 2.5],
    [NaN, { nonfinite: "NaN" }],
    [-Infinity, { nonfinite: "-Infinity" }],
    [true, { bool: true }],
    ["a", { str: "a" }],
    [undefined, { undefined: true }],
    [null, { other: "null" }],
    [
      [1, [2, NaN]],
      [1, [2, { nonfinite: "NaN" }]],
    ],
  ])("reduces %j", (value, expected) => {
    expect(fingerprint(value)).toEqual(expected);
  });

  it("reduces mathjs matrices and complex numbers", () => {
    expect(fingerprint(math.matrix([1, 2]))).toEqual([1, 2]);
    expect(fingerprint(math.complex(1, -2))).toEqual({ re: 1, im: -2 });
  });

  it("names the type of anything else", () => {
    expect(fingerprint(new Map())).toEqual({ other: "Map" });
  });

  it("samples a function at every point of its arity", () => {
    const f = (x: number, y: number) => x * y;
    expect(fingerprint(f)).toEqual({
      fn: 2,
      at: POINTS[2].map(([x, y]) => x * y),
    });
  });

  it("marks a point that throws", () => {
    const f = (x: number) => {
      if (x === 0) throw new Error("0");
      return x;
    };
    const fp = fingerprint(f) as { at: unknown[] };
    expect(fp.at[POINTS[1].findIndex(([x]) => x === 0)]).toEqual({
      error: true,
    });
    expect(fp).not.toHaveProperty("vec");
  });

  it("samples nested functions at the first 4 points", () => {
    const f = (x: number) => (y: number) => x + y;
    const { at } = fingerprint(f) as { at: { fn: number; at: unknown[] }[] };
    const [[x]] = POINTS[1];
    expect(at[0].at).toEqual(POINTS[1].slice(0, 4).map(([y]) => x + y));
  });

  it("stops sampling at depth 2", () => {
    const f = (x: number) => (y: number) => (z: number) => x + y + z;
    const { at } = fingerprint(f) as { at: { fn: number; at: unknown[] }[] };
    expect(at[0].at[0]).toEqual({ fn: 1, at: null });
  });

  it("retries with vector arguments when every scalar point throws", () => {
    const f = (p: number[]) => {
      if (!Array.isArray(p)) throw new Error("scalar");
      return p[0] * p[1];
    };
    const fp = fingerprint(f) as { vec: Record<2 | 3, unknown[]> };
    expect(fp.vec[2][0]).toEqual(POINTS[2][0][0] * POINTS[2][0][1]);
    expect(fp.vec[3]).toHaveLength(POINTS[1].length);
  });

  it("passes argument i of vector point j from vector point j + i", () => {
    const f = (p: number[], q: number[]) => {
      if (!Array.isArray(p)) throw new Error("scalar");
      return p[0] * q[1];
    };
    const fp = fingerprint(f) as { vec: Record<2 | 3, unknown[]> };
    expect(fp.vec[2][0]).toEqual(POINTS[2][0][0] * POINTS[2][1][1]);
  });
});
