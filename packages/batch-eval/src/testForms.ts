import math from "@math3d/custom-mathjs";
import { batchOf, registerBatch, vectorBatchOf } from "./registry";

export type Fn = (...args: number[]) => unknown;

/**
 * `expr` evaluated by mathjs, with its result offered to the registry.
 * `expr` is a function assignment; its name is added to `scope`.
 */
export const define = (
  expr: string,
  scope: Record<string, unknown> = {},
): Fn => {
  const node = math.parse(expr);
  const f = node.compile().evaluate(new Map(Object.entries(scope))) as Fn;
  registerBatch(f, node, new Map(Object.entries(scope)));
  return f;
};

/** What `f`'s batched form gives over `columns`, one per parameter. */
export const runForm = (f: Fn, columns: number[][]) =>
  batchOf(f)?.run(
    columns[0].length,
    ...columns.map((column) => Float64Array.from(column)),
  );

/** The samples of `columns` where `f`'s batched form doesn't give what `f` gives. */
export const mismatches = (f: Fn, columns: number[][]) => {
  const result = runForm(f, columns);
  if (!result) throw new Error("No batched form, or it declined.");
  return columns[0].flatMap((_x, i) => {
    const expected = f(...columns.map((column) => column[i]));
    return Object.is(result[i], expected)
      ? []
      : [{ i, actual: result[i], expected }];
  });
};

/** What `f`'s vector form gives over `columns`, one per parameter. */
const runVectorForm = (f: Fn, columns: number[][]) =>
  vectorBatchOf(f)?.run(
    columns[0].length,
    ...columns.map((column) => Float64Array.from(column)),
  );

/** The components of samples where `f`'s vector form doesn't give what `f` gives. */
export const vectorMismatches = (f: Fn, columns: number[][]) => {
  const result = runVectorForm(f, columns);
  if (!result) throw new Error("No vector form, or it declined.");
  return columns[0].flatMap((_x, i) => {
    const value = f(...columns.map((column) => column[i]));
    const expected = (
      math.isMatrix(value) ? value.toArray() : value
    ) as number[];
    if (expected.length !== result.length) throw new Error("Wrong size.");
    return expected.flatMap((x, k) =>
      Object.is(result[k][i], x)
        ? []
        : [{ i, k, actual: result[k][i], expected: x }],
    );
  });
};
