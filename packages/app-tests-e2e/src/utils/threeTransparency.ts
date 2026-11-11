import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { decodePng } from "@/utils/decodePng";

const RED = "#ff0000";
const BLUE = "#0000ff";

const plane = (
  height: number,
  color: string,
  opacity: string,
  more: object = {},
) => ({
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
  ...more,
});

/**
 * An opaque red plane over a translucent blue one. The default camera looks
 * down on them, so the blue one shows only where it sticks out.
 */
export const redOverBlue = (): SceneBuilder => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .explicitSurface(plane(1, RED, "1"))
    .explicitSurface(plane(-1, BLUE, "0.5"));
  return scene;
};

/**
 * A translucent blue plane over an opaque red one, with a `zOrder` that draws
 * the blue one first: in MathBox's order it then hides the red one.
 */
export const blueFirstOverRed = (): SceneBuilder => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .explicitSurface(plane(1, BLUE, "0.5", { zOrder: "-1" }))
    .explicitSurface(plane(-1, RED, "1"));
  return scene;
};

/** The shares of the viewport that are plain red, and blue blended over red or white. */
export const shares = async (page: Page) => {
  const png = await page.getByTestId("scene").screenshot();
  const { data } = await decodePng(png);
  const half = (value: number) => value > 100 && value < 155;
  let red = 0;
  let blueOverRed = 0;
  let blueOverWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 230 && g < 25 && b < 25) red += 1;
    if (half(r) && g < 25 && half(b)) blueOverRed += 1;
    if (half(r) && half(g) && b > 230) blueOverWhite += 1;
  }
  const pixels = data.length / 4;
  return {
    red: red / pixels,
    blueOverRed: blueOverRed / pixels,
    blueOverWhite: blueOverWhite / pixels,
  };
};

/** Polls the viewport until `share` of it is drawn, then returns every share. */
export const sharesOnce = async (
  page: Page,
  share: keyof Awaited<ReturnType<typeof shares>>,
) => {
  await expect
    .poll(async () => (await shares(page))[share], { timeout: 15_000 })
    .toBeGreaterThan(0.01);
  return shares(page);
};

/**
 * For `redOverBlue`: the red plane hides the blue one behind it, which shows
 * where it sticks out, and no frame blends the two.
 */
export const expectRedToHideBlue = async (page: Page) => {
  const { blueOverRed, blueOverWhite } = await sharesOnce(page, "red");
  expect(blueOverWhite).toBeGreaterThan(0.01);
  expect(blueOverRed).toBeLessThan(0.001);
};

/** Narrows the window and waits for the canvas to follow. */
export const narrowWindow = async (page: Page) => {
  const canvas = page.getByTestId("scene").locator("canvas");
  const width = () => canvas.evaluate((c: HTMLCanvasElement) => c.width);
  const before = await width();
  const size = page.viewportSize()!;
  await page.setViewportSize({ ...size, width: size.width - 40 });
  await expect.poll(width).toBeLessThan(before);
};
