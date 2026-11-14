import {
  colorMapValue,
  explicitColorFunc,
  gridlineColor,
} from "./surfaceColor";

test("an explicit surface's color function reads only the coordinates", () => {
  const color = explicitColorFunc((x, y, z) => 100 * x + 10 * y + z);
  expect(color(1, 2, 3, 7, 8)).toBe(123);
});

test.each([
  ["#3090ff", "#0062d3"],
  ["#f1c40f", "#987b09"],
])("a %s surface's gridlines are %s, as in math3d-react", (color, line) => {
  expect(gridlineColor(color)).toBe(line);
});

test.each([
  { t: 0.25, wrap: true, expected: 0.25 },
  // [0, 1] is inclusive, with a hair of tolerance either side.
  { t: 1, wrap: true, expected: 1 },
  { t: 1 + 5e-5, wrap: true, expected: 1 },
  { t: 1 + 2e-4, wrap: true, expected: 2e-4 },
  { t: -5e-5, wrap: true, expected: 0 },
  { t: 1.25, wrap: true, expected: 0.25 },
  { t: -0.25, wrap: true, expected: 0.75 },
  { t: 2, wrap: true, expected: 0 },
  { t: 1.25, wrap: false, expected: 1 },
  { t: -0.25, wrap: false, expected: 0 },
  { t: NaN, wrap: true, expected: 0 },
  { t: Infinity, wrap: false, expected: 0 },
])("colorMapValue($t, wrap: $wrap) is $expected", ({ t, wrap, expected }) => {
  expect(colorMapValue(t, wrap)).toBeCloseTo(expected, 12);
});
