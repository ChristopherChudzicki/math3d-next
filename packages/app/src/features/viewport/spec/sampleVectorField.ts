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
