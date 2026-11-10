import { expect, test } from "vitest";
import { rasterSize } from "./CanvasSurface";
import { fromMathBoxOffset } from "./Labels";

test("a raster pads the text for its outline, in device pixels", () => {
  expect(rasterSize(10, 1)).toEqual([16, 26]);
  expect(rasterSize(10.2, 2)).toEqual([33, 52]);
});

test("MathBox's offsets scale with its 16-of-24 px text, less its sprite's 4 atlas px", () => {
  expect(fromMathBoxOffset([0, 40])).toEqual([0, 24]);
  expect(fromMathBoxOffset([0, -20])).toEqual([0, -16]);
  expect(fromMathBoxOffset([30, 0])).toEqual([20, -8 / 3]);
});
