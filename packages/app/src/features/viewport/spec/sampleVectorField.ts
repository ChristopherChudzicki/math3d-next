import type { AxesRange, Coords } from "@math3d/viewport-spec";

// As math3d's MathBox Volume places them: a count below 1 samples once, at
// the start of its range; a count of 1 sits at the midpoint.
const axisSamples = ([min, max]: [number, number], n: number): number[] => {
  if (n < 1) return [min];
  if (n === 1) return [(min + max) / 2];
  return Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1));
};

/**
 * One `[tail, head]` per grid point, x fastest (as `MB.Volume` emits), with
 * `head = tail + scale · expr(tail)`. `values`, when given, is `expr` over
 * columns of points: one array per component, or `undefined` to decline.
 */
export const sampleVectorField = (
  expr: (x: number, y: number, z: number) => Coords,
  domain: AxesRange,
  samples: [number, number, number],
  scale: number,
  values?: (
    xs: Float64Array,
    ys: Float64Array,
    zs: Float64Array,
  ) => Float64Array[] | undefined,
): Coords[][] => {
  const axes = domain.map((range, i) => axisSamples(range, samples[i]));
  const count = axes[0].length * axes[1].length * axes[2].length;
  const xs = new Float64Array(count);
  const ys = new Float64Array(count);
  const zs = new Float64Array(count);
  let n = 0;
  axes[2].forEach((z) => {
    axes[1].forEach((y) => {
      axes[0].forEach((x) => {
        xs[n] = x;
        ys[n] = y;
        zs[n] = z;
        n += 1;
      });
    });
  });
  const [us, vs, ws] = values?.(xs, ys, zs) ?? [];
  const paths: Coords[][] = new Array(count);
  for (let k = 0; k < count; k += 1) {
    const x = xs[k];
    const y = ys[k];
    const z = zs[k];
    const [u, v, w] = us ? [us[k], vs[k], ws[k]] : expr(x, y, z);
    paths[k] = [
      [x, y, z],
      [x + scale * u, y + scale * v, z + scale * w],
    ];
  }
  return paths;
};
