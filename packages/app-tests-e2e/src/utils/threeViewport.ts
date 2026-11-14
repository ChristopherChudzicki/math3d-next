import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

/**
 * Waits for the three.js viewport to draw and settle, and for the loading knot,
 * whose canvas sits in the scene beside the renderer's, to leave.
 */
export const expectThreeViewport = async (page: Page) => {
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
    timeout: 15_000,
  });
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await expect(viewport.locator("canvas")).toBeVisible();
};

/** The share of the viewport's pixels that are colored. */
export const coloredShare = async (page: Page): Promise<number> =>
  colorfulPixelRatio(await page.getByTestId("scene").screenshot());
