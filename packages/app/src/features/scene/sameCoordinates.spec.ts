import { expect, test } from "vitest";
import sameCoordinates from "./sameCoordinates";

test.each([
  { a: [1, -2, 3], b: [1, -2, 3], same: true },
  // Round-off from converting between UI and three.js coordinates
  { a: [0, 0, 0], b: [1e-15, -2e-16, 0], same: true },
  { a: [-4.5, 6, 3], b: [-4.5000000001, 5.9999999999, 3], same: true },
  // A real, if small, move
  { a: [-4.5, 6, 3], b: [-4.49, 6, 3], same: false },
])("sameCoordinates($a, $b) is $same", ({ a, b, same }) => {
  expect(sameCoordinates(a, b)).toBe(same);
});
