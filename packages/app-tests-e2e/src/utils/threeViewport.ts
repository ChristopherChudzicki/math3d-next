import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

/** Waits for the three.js viewport to draw and settle. */
export const expectThreeViewport = async (page: Page) => {
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
    timeout: 15_000,
  });
};

/** The share of the viewport's pixels that are colored. */
export const coloredShare = async (page: Page): Promise<number> =>
  colorfulPixelRatio(await page.getByTestId("scene").screenshot());
