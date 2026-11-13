import { describe, expect, it } from "vitest";
import { realRootSign } from "./realRootSign";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

describe("realRootSign", () => {
  it("is (-1)^p for every p/q with q odd and below 100, and 0 for an even q", () => {
    for (let q = 2; q < 100; q += 1) {
      for (let p = 1; p < 2 * q; p += 1) {
        if (gcd(p, q) === 1) {
          const expected = q % 2 === 0 ? 0 : (-1) ** p;
          expect(realRootSign(p / q), `${p}/${q}`).toBe(expected);
        }
      }
    }
  });

  it.each([
    ["a fraction reached with rounding error", 1 - 2 / 3, -1],
    ["a negative exponent", -2 / 3, 1],
    ["a decimal that is an odd fraction", 0.2, -1],
  ])("takes %s", (_title, y, expected) => {
    expect(realRootSign(y)).toBe(expected);
  });

  it.each([
    ["a denominator of 100 or more", 1 / 101],
    ["an infinite exponent", Infinity],
  ])("leaves %s to the principal root", (_title, y) => {
    expect(realRootSign(y)).toBe(0);
  });
});
