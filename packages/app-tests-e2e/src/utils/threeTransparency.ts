import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { decodePng } from "@/utils/decodePng";

const plane = (height: number, color: string, opacity: string) => ({
  expr: {
    type: "function-assignment" as const,
    name: "_f",
    params: ["x", "y"],
    rhs: String(height),
  },
  color,
  opacity,
  shaded: "false",
  gridOpacity: "0",
});

/**
 * An opaque red plane over a translucent blue one. The default camera looks
 * down on them, so the blue one shows only where it sticks out.
 */
export const redOverBlue = (): SceneBuilder => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .explicitSurface(plane(1, "#ff0000", "1"))
    .explicitSurface(plane(-1, "#0000ff", "0.5"));
  return scene;
};

/** The shares of the viewport that are plain red, and blue blended over red. */
const shares = async (page: Page) => {
  const png = await page.getByTestId("scene").screenshot();
  const { data } = await decodePng(png);
  let red = 0;
  let blueOverRed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 230 && g < 25 && b < 25) red += 1;
    if (r > 100 && r < 155 && g < 25 && b > 100 && b < 155) blueOverRed += 1;
  }
  const pixels = data.length / 4;
  return { red: red / pixels, blueOverRed: blueOverRed / pixels };
};

/** The red plane hides the blue one behind it: no frame blends them. */
export const expectRedToHideBlue = async (page: Page) => {
  await expect
    .poll(async () => (await shares(page)).red, { timeout: 15_000 })
    .toBeGreaterThan(0.05);
  expect((await shares(page)).blueOverRed).toBeLessThan(0.001);
};
