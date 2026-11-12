import {
  explicitColorFunc,
  gridlineColor,
  specGridlineColor,
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

test("a surface's gridlines in the viewport spec scale its lightness by 0.55", () => {
  expect(specGridlineColor("#3090ff")).toBe("#004da7");
});
