import { batchOf } from "@math3d/batch-eval";
import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import { expect, test, vi } from "vitest";
import { getValidatedEvaluate } from "./evaluate";

// Every expression goes to mathjs, as one fastCompile can't handle does.
vi.mock("./fastCompile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./fastCompile")>()),
  fastCompile: (node: mjs.MathNode) => node.compile(),
}));

test("a function mathjs evaluates gets no batched form", () => {
  const f = getValidatedEvaluate(math.parse("f(x) = x + 1"))(new Map()) as (
    x: number,
  ) => number;
  expect(f(2)).toBe(3);
  expect(batchOf(f)).toBeUndefined();
});
