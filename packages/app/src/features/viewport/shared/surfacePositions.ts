import { batchOf } from "@math3d/batch-eval";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { vectorValues } from "./vectorValues";

type Positions = NonNullable<SurfaceSpec["positions"]>;
type Columns = [Float64Array, Float64Array, Float64Array];
/** Maps (U, V) ∈ [0, 1]² onto a surface function's two arguments. */
type UV = (U: number, V: number) => [number, number];

/**
 * `positions` from `points`, which gets the surface function's two argument
 * columns. A throw from `uv` declines; `position` then meets the same throw.
 */
const overDomain = (
  uv: UV,
  points: (
    count: number,
    as: Float64Array,
    bs: Float64Array,
  ) => Columns | undefined,
): Positions => {
  let as = new Float64Array(0);
  let bs = new Float64Array(0);
  return (us, vs) => {
    const count = us.length;
    if (as.length !== count) {
      as = new Float64Array(count);
      bs = new Float64Array(count);
    }
    try {
      for (let k = 0; k < count; k += 1) {
        [as[k], bs[k]] = uv(us[k], vs[k]);
      }
    } catch {
      return undefined;
    }
    return points(count, as, bs);
  };
};

/** `positions` of `(u, v) ↦ expr(u, v)`, when `expr` has a batched form. */
export const parametricPositions = (
  expr: unknown,
  uv: UV,
): Positions | undefined => {
  const values = vectorValues(expr, 2, 3);
  return (
    values &&
    overDomain(uv, (_count, us, vs) => values(us, vs) as Columns | undefined)
  );
};

/** `positions` of `explicitSurface(expr)`, when `expr` has a batched form. */
export const explicitPositions = (
  expr: unknown,
  uv: UV,
): Positions | undefined => {
  const form = batchOf(expr);
  if (!form || form.params !== 2) return undefined;
  return overDomain(uv, (count, xs, ys) => {
    const zs = form.run(count, xs, ys);
    return zs && [xs, ys, zs];
  });
};

/** `positions` of `explicitPolarSurface(expr)`, when `expr` has a batched form. */
export const polarPositions = (
  expr: unknown,
  uv: UV,
): Positions | undefined => {
  const form = batchOf(expr);
  if (!form || form.params !== 2) return undefined;
  let xs = new Float64Array(0);
  let ys = new Float64Array(0);
  return overDomain(uv, (count, rs, qs) => {
    const zs = form.run(count, rs, qs);
    if (!zs) return undefined;
    if (xs.length !== count) {
      xs = new Float64Array(count);
      ys = new Float64Array(count);
    }
    for (let k = 0; k < count; k += 1) {
      xs[k] = rs[k] * Math.cos(qs[k]);
      ys[k] = rs[k] * Math.sin(qs[k]);
    }
    return [xs, ys, zs];
  });
};
