import { vectorBatchOf } from "@math3d/batch-eval";

/**
 * `f` over columns of its arguments, when it has a batched form that takes
 * `params` numbers and returns `size`: entry `k` of result `c` is component
 * `c` of `f` at entry `k` of each column. `undefined` when `f` has no such
 * form; the function returned gives `undefined` when the form declines.
 */
export const vectorValues = (f: unknown, params: number, size: number) => {
  const form = vectorBatchOf(f);
  if (!form || form.params !== params || form.size !== size) return undefined;
  return (...columns: Float64Array[]) =>
    form.run(columns[0].length, ...columns);
};
