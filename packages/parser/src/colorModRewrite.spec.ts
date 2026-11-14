import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import math from "@math3d/custom-mathjs";
import type { MathNode } from "mathjs";
import { latexParser as parser } from "./parsers";

type Cases = {
  rewritten: { original: string; rewritten: string; wraps: boolean }[];
};

// Read, not imported: the cases belong to the backend, outside this package.
const cases: Cases = JSON.parse(
  readFileSync(
    new URL(
      "../../../webserver/scenes/legacy_scene_utils/strip_mod_cases.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

const parse = (latex: string) => math.parse(parser.preprocess(latex));

/** Random values for the free symbols, and identity for unknown functions. */
const randomScope = (nodes: MathNode[]) => {
  const scope: Record<string, unknown> = {};
  nodes.forEach((node) =>
    node.traverse((child, path, parent) => {
      if (!math.isSymbolNode(child) || child.name in math) return;
      const called = math.isFunctionNode(parent) && path === "fn";
      scope[child.name] = called
        ? (x: number) => x
        : (Math.random() - 0.5) * 20;
    }),
  );
  return scope;
};

/**
 * How far apart the map positions are: the original clamped, as the scenes
 * it comes from drew it, and the rewrite clamped or, when it wraps, mod 1.
 */
const distance = (original: number, rewritten: number, wraps: boolean) => {
  const clamped = Math.min(Math.max(original, 0), 1);
  if (!wraps) return Math.abs(clamped - Math.min(Math.max(rewritten, 0), 1));
  const d = Math.abs(clamped - rewritten) % 1;
  return Math.min(d, 1 - d);
};

/**
 * The backend rewrites a saved color expression's outer `mod`
 * (`webserver/scenes/legacy_scene_utils/strip_mod.py`). Each rewrite must
 * draw as its original did.
 */
describe("the backend's color mod rewrites agree with the parser", () => {
  test.each(cases.rewritten)("$original", ({ original, rewritten, wraps }) => {
    const before = parse(original);
    const after = parse(rewritten);
    for (let k = 0; k < 20; k += 1) {
      const scope = randomScope([before, after]);
      const a = before.evaluate({ ...scope });
      const b = after.evaluate({ ...scope });
      expect(distance(a, b, wraps)).toBeLessThan(1e-9);
    }
  });
});
