import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { decodePng } from "./decodePng";

const fn = (params: string[], rhs: string) => ({
  type: "function-assignment" as const,
  name: "_f",
  params,
  rhs,
});

/**
 * An unshaded, opaque plane z = 0 over `xRange`, one cell wide along x,
 * colored by `mod(value, 1)`.
 */
const plane = (color: string, xRange: string, value: string) => ({
  expr: fn(["x", "y"], "0"),
  domain: {
    type: "array" as const,
    items: [fn(["y"], xRange), fn(["x"], "[-2, 2]")],
  },
  samples1: "2",
  color,
  colorExpr: fn(["x", "y", "z"], `mod(${value}, 1)`),
  shaded: "false",
  opacity: "1",
  gridOpacity: "0",
});

/**
 * Two planes seen from above. One is Blue to Red, its single cell running
 * from 0.9 through the wrap to 0.1; the other is Temperature at 0.5, green.
 */
export const colorMapPlanes = () => {
  const scene = new SceneBuilder();
  scene.camera({ position: "[1, 2, 8]", target: "[0, 0, 0]" });
  const folder = scene.folder();
  folder.explicitSurface(plane("bluered", "[-2, 0]", "0.9 + 0.1(x + 2)"));
  folder.explicitSurface(plane("temperature", "[0, 2]", "0.5"));
  return scene;
};

/**
 * Each plane draws its own map, and the wrapping cell draws the map's two
 * ends with an edge between them: blended as vertex colors, it would pass
 * through purple.
 */
export const expectColorMapPlanes = async (page: Page) => {
  const { data } = await decodePng(
    await page.getByTestId("scene").screenshot(),
  );
  let ends = 0;
  let purple = 0;
  let green = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (g <= 20 && r + b > 200 && Math.abs(r - b) > 150) ends += 1;
    if (g <= 20 && r > 80 && r < 176 && b > 80 && b < 176) purple += 1;
    if (r < 20 && g > 235 && b < 20) green += 1;
  }
  const pixels = data.length / 4;
  expect(ends).toBeGreaterThan(pixels / 20);
  expect(purple).toBeLessThan(pixels / 200);
  expect(green).toBeGreaterThan(pixels / 20);
};
