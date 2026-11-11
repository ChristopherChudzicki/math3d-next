import { expect, test } from "vitest";
import { formatTick } from "./formatTick";

test.each([
  [1 / 3, "0.33"],
  [1234, "1200"],
  [0.00000012, "1.2e-7"],
])("formatTick(%s) is %s, as MathBox prints it", (value, text) => {
  expect(formatTick(value)).toBe(text);
});
