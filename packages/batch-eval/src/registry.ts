import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";
import { compile } from "./compile";
import type { Scope } from "./compile";
import { createPool } from "./pool";
import type {
  BatchForm,
  Column,
  Compiled,
  Pool,
  VectorBatchForm,
} from "./types";

type Forms = { number?: BatchForm; vector?: VectorBatchForm };
type Entry = Forms & { compiled: Compiled };

const entries = new WeakMap<object, Entry>();

const entryOf = (f: unknown): Entry | undefined =>
  typeof f === "function" ? entries.get(f) : undefined;

/** `result` as an array the form owns, from its pool. */
const owned = (
  result: Column,
  count: number,
  args: Column[],
  pool: Pool,
): Float64Array => {
  if (typeof result === "number") return pool.take().fill(result);
  // A parameter's own column is the caller's array, not this form's.
  if (args.includes(result)) {
    const copy = pool.take();
    copy.set(result.subarray(0, count));
    return copy;
  }
  return result;
};

const toForms = ({ params, vector, components }: Compiled): Forms => {
  const pool = createPool();
  const run = (count: number, ...args: Column[]) => {
    try {
      pool.reset(count);
      return components.map((component) =>
        owned(component(count, args, pool), count, args, pool),
      );
    } catch {
      return undefined;
    }
  };
  return vector
    ? { vector: { params, size: components.length, run } }
    : { number: { params, run: (...args) => run(...args)?.[0] } };
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
    entries.set(f, { compiled, ...toForms(compiled) });
  } catch {
    // No batched form: samplers use `f` itself.
  }
};

/** `f`'s batched form, when `f` returns a number. */
export const batchOf = (f: unknown): BatchForm | undefined =>
  entryOf(f)?.number;

/** `f`'s batched form, when `f` returns a vector. */
export const vectorBatchOf = (f: unknown): VectorBatchForm | undefined =>
  entryOf(f)?.vector;
