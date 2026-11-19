import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import { compile } from "./compile";
import type { Scope } from "./compile";
import { createPool } from "./pool";
import type { BatchForm, Column, Compiled } from "./types";

type Entry = { compiled: Compiled; form: BatchForm };

const entries = new WeakMap<object, Entry>();

const entryOf = (f: unknown): Entry | undefined =>
  typeof f === "function" ? entries.get(f) : undefined;

const toForm = ({ params, evaluate }: Compiled): BatchForm => {
  const pool = createPool();
  const run = (count: number, ...args: Column[]) => {
    try {
      pool.reset(count);
      const result = evaluate(count, args, pool);
      if (typeof result === "number") return pool.take().fill(result);
      // A parameter's own column is the caller's array, not this form's.
      if (args.includes(result)) {
        const copy = pool.take();
        copy.set(result.subarray(0, count));
        return copy;
      }
      return result;
    } catch {
      return undefined;
    }
  };
  return { params, run };
};

/**
 * Gives `f` a batched form if `node` supports one. Never throws. `f` must be
 * a function `fastCompile` built from `node`, or a wrapper that returns its
 * numbers unchanged.
 */
export const registerBatch = (
  f: object,
  node: mjs.MathNode,
  scope: Scope,
): void => {
  if (!math.isFunctionAssignmentNode(node)) return;
  try {
    const compiled = compile(node, scope, (value) => entryOf(value)?.compiled);
    entries.set(f, { compiled, form: toForm(compiled) });
  } catch {
    // No batched form: samplers use `f` itself.
  }
};

export const batchOf = (f: unknown): BatchForm | undefined => entryOf(f)?.form;
