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

/**
 * A translucent blue plane over a translucent red one, with `zOrder`s that
 * draw `first` first and both after everything else in the scene.
 */
export const translucentPair = (first: "blue" | "red"): SceneBuilder => {
  const [blue, red] = first === "blue" ? ["100", "101"] : ["101", "100"];
  const scene = new SceneBuilder();
  scene
    .folder()
    .explicitSurface(plane(1, BLUE, "0.5", { zOrder: blue }))
    .explicitSurface(plane(-1, RED, "0.5", { zOrder: red }));
  return scene;
};

type Rgb = [number, number, number];

/** The mean color of the middle of the viewport, where the planes overlap. */
const middleColor = async (page: Page): Promise<Rgb> => {
  const png = await page.getByTestId("scene").screenshot();
  const { data, width, height } = await decodePng(png);
  const half = 10;
  const sum: Rgb = [0, 0, 0];
  for (let y = height / 2 - half; y < height / 2 + half; y += 1) {
    for (let x = width / 2 - half; x < width / 2 + half; x += 1) {
      const i = 4 * (Math.floor(y) * width + Math.floor(x));
      sum[0] += data[i];
      sum[1] += data[i + 1];
      sum[2] += data[i + 2];
    }
  }
  const pixels = (2 * half) ** 2;
  return [sum[0] / pixels, sum[1] / pixels, sum[2] / pixels];
};

/** Polls until the middle of the viewport is drawn, then returns its color. */
export const overlapColor = async (page: Page): Promise<Rgb> => {
  await expect
    .poll(async () => Math.min(...(await middleColor(page))), {
      timeout: 15_000,
    })
    .toBeLessThan(230);
  return middleColor(page);
};

/** Two colors alike to within what dithering and rounding move a channel. */
export const expectSameColor = (actual: Rgb, expected: Rgb) => {
  actual.forEach((channel, i) => {
    expect(Math.abs(channel - expected[i])).toBeLessThan(3);
  });
};

/**
 * The shares of the viewport that are plain red, blue blended over red or
 * white, and red blended into white, as along an antialiased red edge.
 */
export const shares = async (page: Page) => {
  const png = await page.getByTestId("scene").screenshot();
  const { data } = await decodePng(png);
  const half = (value: number) => value > 100 && value < 155;
  let red = 0;
  let blueOverRed = 0;
  let blueOverWhite = 0;
  let redIntoWhite = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 230 && g < 25 && b < 25) red += 1;
    if (half(r) && g < 25 && half(b)) blueOverRed += 1;
    if (half(r) && half(g) && b > 230) blueOverWhite += 1;
    if (r > 230 && g > 40 && g < 215 && Math.abs(g - b) < 25) redIntoWhite += 1;
  }
  const pixels = data.length / 4;
  return {
    red: red / pixels,
    blueOverRed: blueOverRed / pixels,
    blueOverWhite: blueOverWhite / pixels,
    redIntoWhite: redIntoWhite / pixels,
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
