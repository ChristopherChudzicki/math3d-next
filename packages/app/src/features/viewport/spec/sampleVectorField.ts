import type { AxesRange, Coords } from "@math3d/viewport-spec";

// A lone sample sits at the midpoint, as MathBox's centered Volume puts it.
const axisSamples = ([min, max]: [number, number], n: number): number[] =>
  n === 1
    ? [(min + max) / 2]
    : Array.from({ length: n }, (_, i) => min + ((max - min) * i) / (n - 1));

/**
 * One `[tail, head]` per grid point, x fastest (as `MB.Volume` emits), with
 * `head = tail + scale · expr(tail)`.
 */
export const sampleVectorField = (
  expr: (x: number, y: number, z: number) => Coords,
  domain: AxesRange,
  samples: [number, number, number],
  scale: number,
): Coords[][] => {
  const [xs, ys, zs] = domain.map((range, i) => axisSamples(range, samples[i]));
  const paths: Coords[][] = [];
  zs.forEach((z) => {
    ys.forEach((y) => {
      xs.forEach((x) => {
        const [u, v, w] = expr(x, y, z);
        paths.push([
          [x, y, z],
          [x + scale * u, y + scale * v, z + scale * w],
        ]);
      });
    });
  });
  return paths;
};
