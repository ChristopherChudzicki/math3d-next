import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { sampleVectorField } from "./sampleVectorField";

test("samples tail and scaled head at each grid point, x fastest", () => {
  expect(
    sampleVectorField(
      (x, y) => [y, x, 0],
      [
        [0, 1],
        [0, 1],
        [0, 0],
      ],
      [2, 2, 1],
      0.5,
    ),
  ).toEqual([
    [
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [1, 0, 0],
      [1, 0.5, 0],
    ],
    [
      [0, 1, 0],
      [0.5, 1, 0],
    ],
    [
      [1, 1, 0],
      [1.5, 1.5, 0],
    ],
  ]);
});

test("an axis with one sample sits at its midpoint", () => {
  expect(
    sampleVectorField(
      () => [0, 0, 1],
      [
        [2, 5],
        [0, 0],
        [0, 0],
      ],
      [1, 1, 1],
      1,
    ),
  ).toEqual([
    [
      [3.5, 0, 0],
      [3.5, 0, 1],
    ],
  ]);
});

describe("with batched values", () => {
  const domain: AxesRange = [
    [0, 1],
    [2, 4],
    [5, 6],
  ];
  const field = (x: number, y: number, z: number): Coords => [y + z, x, z];

  test("gives the per-sample paths without calling the expression", () => {
    const expr = vi.fn(field);
    const values = (xs: Float64Array, ys: Float64Array, zs: Float64Array) => [
      ys.map((y, k) => y + zs[k]),
      xs,
      zs,
    ];
    expect(sampleVectorField(expr, domain, [2, 3, 2], 0.5, values)).toEqual(
      sampleVectorField(field, domain, [2, 3, 2], 0.5),
    );
    expect(expr).not.toHaveBeenCalled();
  });

  test("calls the expression when they decline", () => {
    expect(
      sampleVectorField(field, domain, [2, 3, 2], 0.5, () => undefined),
    ).toEqual(sampleVectorField(field, domain, [2, 3, 2], 0.5));
  });
});
