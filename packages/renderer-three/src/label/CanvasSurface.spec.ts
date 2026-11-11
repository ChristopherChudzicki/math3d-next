import { expect, test } from "vitest";
import { rasterSize } from "./CanvasSurface";

test("rasterSize pads the text for its outline, then rounds up to device pixels", () => {
  expect(rasterSize(10.2, 2)).toEqual([33, 52]);
});
