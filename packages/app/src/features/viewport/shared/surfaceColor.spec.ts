import { explicitColorFunc } from "./surfaceColor";

test("an explicit surface's color function reads only the coordinates", () => {
  const color = explicitColorFunc((x, y, z) => 100 * x + 10 * y + z);
  expect(color(1, 2, 3, 7, 8)).toBe(123);
});
