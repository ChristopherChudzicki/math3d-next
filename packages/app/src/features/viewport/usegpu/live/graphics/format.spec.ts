import { formatTick } from "./format";

test("formatTick trims trailing zeros and keeps at most 3 decimals", () => {
  expect([150, 0.5, 1 / 3].map(formatTick)).toEqual(["150", "0.5", "0.333"]);
});
