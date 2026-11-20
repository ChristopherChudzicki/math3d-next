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
 * colored by `value`.
 */
const plane = (color: string, xRange: string, value: string) => ({
  expr: fn(["x", "y"], "0"),
  domain: {
    type: "array" as const,
    items: [fn(["y"], xRange), fn(["x"], "[-2, 2]")],
  },
  samples1: "2",
  color,
  colorExpr: fn(["x", "y", "z"], value),
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
  folder.explicitSurface(
    plane("bluered", "[-2, 0]", "mod(0.9 + 0.1(x + 2), 1)"),
  );
  folder.explicitSurface(plane("temperature", "[0, 2]", "mod(0.5, 1)"));
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

/**
 * Two one-cell Rainbow planes with no `mod`, seen from above. One runs from
 * 0.64 to 0.70, through green; the other steps from 0 to 1, both ends red.
 */
export const colorMapPlanesNoMod = () => {
  const scene = new SceneBuilder();
  scene.camera({ position: "[1, 2, 8]", target: "[0, 0, 0]" });
  const folder = scene.folder();
  folder.explicitSurface(plane("rainbow", "[-2, 0]", "0.64 + 0.03(x + 2)"));
  folder.explicitSurface(plane("rainbow", "[0, 2]", "floor(x/2 + 1/2)"));
  return scene;
};

/**
 * The smooth cell reaches the map's pure green, which blended vertex colors
 * miss; the step stays red, where a lookup would sweep the whole map.
 */
export const expectColorMapPlanesNoMod = async (page: Page) => {
  const { data } = await decodePng(
    await page.getByTestId("scene").screenshot(),
  );
  let green = 0;
  let blue = 0;
  let red = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r < 20 && g > 235 && b < 20) green += 1;
    if (b > 200 && r + g < 100) blue += 1;
    if (r > 235 && g < 20 && b < 20) red += 1;
  }
  const pixels = data.length / 4;
  expect(green).toBeGreaterThan(pixels / 50);
  expect(blue).toBeLessThan(pixels / 200);
  expect(red).toBeGreaterThan(pixels / 20);
};
