import { batchOf } from "@math3d/batch-eval";
import type { ImplicitSurfaceSpec } from "@math3d/viewport-spec";

type Fn3 = (x: number, y: number, z: number) => number;

/**
 * `lhs − rhs` over many points, when both sides have a batched form of three
 * parameters.
 */
export const implicitValues = (
  lhs: Fn3,
  rhs: Fn3,
): ImplicitSurfaceSpec["values"] | undefined => {
  const left = batchOf(lhs);
  const right = batchOf(rhs);
  if (!left || !right || left.params !== 3 || right.params !== 3) {
    return undefined;
  }
  // One form's second run would overwrite its first result.
  if (left === right) return undefined;
  let out = new Float64Array(0);
  return (xs, ys, zs) => {
    const count = xs.length;
    const a = left.run(count, xs, ys, zs);
    const b = a && right.run(count, xs, ys, zs);
    if (!a || !b) return undefined;
    if (out.length !== count) out = new Float64Array(count);
    for (let k = 0; k < count; k += 1) out[k] = a[k] - b[k];
    return out;
  };
};
