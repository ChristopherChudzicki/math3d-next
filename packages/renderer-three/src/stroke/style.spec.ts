import { expect, test } from "vitest";
import { headReach } from "./style";

test("headReach is the slant of the full-size cone: 2.5 base radii long", () => {
  // Base radius 6 * 2 / 2 = 6, length 15.
  expect(headReach({ width: 2, arrowSize: 6 })).toBeCloseTo(Math.hypot(15, 6));
});
