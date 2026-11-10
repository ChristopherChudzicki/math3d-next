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
