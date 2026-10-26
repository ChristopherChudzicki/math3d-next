/**
 * Legacy audit: checks the Python translator's 1-based -> 0-based index shift
 * (webserver/scenes/legacy_scene_utils/indexing.py) against this parser.
 *
 * Input: LEGACY_INDEX_SHIFT_IN, a JSONL file of {before, after} LaTeX pairs.
 * For each pair, parsing `before` and subtracting 1 from every index
 * dimension (a range's start only) must give the same tree as parsing
 * `after`. Dimensions are compared after mathjs's simplify, so `i+1-1` and
 * `i` agree. Mismatches go to LEGACY_INDEX_SHIFT_OUT.
 *
 * Skipped unless LEGACY_INDEX_SHIFT_IN is set. Delete with the rest of the
 * legacy audit tooling.
 */
/// <reference types="node" />
import * as fs from "node:fs";
import { describe, it } from "vitest";
import type * as mjs from "mathjs";
import * as full from "mathjs";
import math from "@math3d/custom-mathjs";
import { latexParser } from "../parsers";

const input = process.env.LEGACY_INDEX_SHIFT_IN;
const output = process.env.LEGACY_INDEX_SHIFT_OUT;

const parse = (latex: string): mjs.MathNode =>
  math.parse(latexParser.preprocess(latex));

const minusOne = (node: mjs.MathNode): mjs.MathNode =>
  new math.OperatorNode("-", "subtract", [node, new math.ConstantNode(1)]);

const mapIndices = (
  node: mjs.MathNode,
  mapDimension: (dim: mjs.MathNode) => mjs.MathNode,
  mapRange: (range: mjs.RangeNode) => mjs.MathNode,
): mjs.MathNode =>
  node.transform((n) => {
    // a.x is an IndexNode too, a property access that no shift touches.
    if (!math.isIndexNode(n) || n.dotNotation) return n;
    const recurse = (d: mjs.MathNode) => mapIndices(d, mapDimension, mapRange);
    return new math.IndexNode(
      n.dimensions.map((d) =>
        math.isRangeNode(d)
          ? mapRange(
              new math.RangeNode(
                recurse(d.start),
                recurse(d.end),
                d.step ? recurse(d.step) : undefined,
              ),
            )
          : mapDimension(recurse(d)),
      ),
    );
  });

const shift = (node: mjs.MathNode) =>
  mapIndices(node, minusOne, (range) =>
    range.step
      ? new math.RangeNode(minusOne(range.start), range.end, range.step)
      : new math.RangeNode(minusOne(range.start), range.end),
  );

const canonical = (dim: mjs.MathNode): mjs.MathNode => {
  const text = dim.toString();
  try {
    return new math.SymbolNode(`<${full.simplify(text).toString()}>`);
  } catch {
    return new math.SymbolNode(`<${text}>`);
  }
};

const canon = (node: mjs.MathNode) =>
  mapIndices(node, canonical, (range) =>
    range.step
      ? new math.RangeNode(
          canonical(range.start),
          canonical(range.end),
          canonical(range.step),
        )
      : new math.RangeNode(canonical(range.start), canonical(range.end)),
  ).toString({ parenthesis: "auto" });

const tryCanon = (latex: string, shifted: boolean) => {
  try {
    const node = parse(latex);
    return canon(shifted ? shift(node) : node);
  } catch (err) {
    return `ERROR ${(err as Error).message}`;
  }
};

describe.skipIf(!input)("legacy index shift", () => {
  it("matches the parser's indices", () => {
    const lines = fs.readFileSync(input!, "utf8").split("\n").filter(Boolean);
    const mismatches: object[] = [];
    let unparseable = 0;
    lines.forEach((line: string) => {
      const { before, after } = JSON.parse(line);
      const expected = tryCanon(before, true);
      const actual = tryCanon(after, false);
      if (expected.startsWith("ERROR") && actual.startsWith("ERROR")) {
        unparseable += 1;
      } else if (expected !== actual) {
        mismatches.push({ before, after, expected, actual });
      }
    });
    if (output) {
      fs.writeFileSync(
        output,
        mismatches.map((m) => JSON.stringify(m)).join("\n"),
      );
    }
    // eslint-disable-next-line no-console
    console.log(
      `pairs ${lines.length}, unparseable ${unparseable}, mismatches ${mismatches.length}`,
    );
  }, 600_000);
});
