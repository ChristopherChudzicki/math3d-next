import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

/** Waits for the three.js viewport's first frame. */
export const expectThreeViewport = async (page: Page) => {
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport.locator("[data-ready]")).toBeAttached({
    timeout: 15_000,
  });
};

/**
 * The share of the viewport's pixels that are colored, once any are: the
 * first frame can come before the scene's graphics do.
 */
export const coloredShare = async (page: Page): Promise<number> => {
  const viewport = page.getByTestId("scene");
  const read = async () =>
    colorfulPixelRatio(page, (await viewport.screenshot()).toString("base64"));
  await expect.poll(read, { timeout: 15_000 }).toBeGreaterThan(0);
  return read();
};
