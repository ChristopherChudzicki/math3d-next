/**
 * fingerprint_cases.json lists expressions that mean the same in both apps,
 * with their fingerprints. math3d-react's fingerprint.audit.js checks the
 * same file, so the two fingerprint implementations agree.
 */
import { describe, expect, it } from "vitest";
import { latexParser } from "@math3d/parser";
import cases from "../fingerprint_cases.json";
import { fingerprint } from "./fingerprint";

// Floats may differ in the last bits between the apps' mathjs versions.
const near = (a: unknown, b: unknown): boolean => {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => near(x, b[i]));
  }
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((k) => near(a[k as keyof typeof a], b[k as keyof typeof b]))
    );
  }
  return a === b;
};

describe("fingerprint_cases.json", () => {
  it.each(cases)("$latex", ({ latex, fingerprint: expected }) => {
    const value = latexParser.parse(latex).evaluate(new Map());
    expect(near(fingerprint(value), expected)).toBe(true);
  });
});
