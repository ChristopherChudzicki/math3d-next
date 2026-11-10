import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { fromUi, toUi } from "./coordinates";

const range: AxesRange = [
  [-2, 4],
  [0, 1],
  [-5, 5],
];
const scale: Coords = [1, 2, 0.5];

test.each([true, false])(
  "toUi undoes fromUi (useRelative: %s)",
  (useRelative) => {
    const ui: Coords = [3, 0.25, -4];
    const back = toUi(
      fromUi(ui, range, scale, useRelative),
      range,
      scale,
      useRelative,
    );
    back.forEach((value, i) => expect(value).toBeCloseTo(ui[i], 6));
  },
);

test.each([
  { useRelative: false, ui: [4, 0, 0], cartesian: [1, -2, 0] },
  { useRelative: true, ui: [2, -1, 4], cartesian: [2, -2, 2] },
])(
  "fromUi converts a stored camera coordinate to cartesian (useRelative: $useRelative)",
  ({ useRelative, ui, cartesian }) => {
    expect(fromUi(ui as Coords, range, scale, useRelative)).toEqual(cartesian);
  },
);
