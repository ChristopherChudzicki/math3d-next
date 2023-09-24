import { MathItem } from "@math3d/mathitem-configs";
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Mathfield } from "mathlive";
/**
 * Importing from "@/test_util" includes some TSX which Playwright can't handle,
 * so need to import the TS-only files directly
 */
import { makeItem } from "@/test_util/factories";
import { Scene } from "@/types";
import type { MathboxSelection } from "mathbox";

const getItemForm = (page: Page, item: MathItem): Locator => {
  return page.locator(
    `css=form[aria-label="Settings for ${item.properties.description}"]`
  );
};

/**
 * Get the LaTeX value of a <math-field />. Useful with Playwright locators:
 *
 * @example
 * ```ts
 * await mfLocator.evaluate(getLatex)
 * ```
 */
const getLatex = (e: HTMLElement | SVGElement) => {
  if (e.tagName !== "MATH-FIELD") {
    throw new Error(`Element is a ${e.tagName}, not a MATH_FIELD.`);
  }
  const mf = e as HTMLElement & Mathfield;
  return mf.getValue();
};

const mockScene = (page: Page, scene: Scene) => {
  return page.route(`*/**/v0/scenes/${scene.key}/`, async (route) => {
    await route.fulfill({ json: scene });
  });
};

/**
 * Resolves when mathbox has rendered.
 */
const whenMathboxRendered = (page: Page) =>
  expect(async () => {
    const exists = await page.evaluate(
      () =>
        // @ts-expect-error We assign mathbox to window, but leaving it off
        // the type definitions to discourage use outside of debugging.
        !!window.mathbox
    );
    expect(exists).toBe(true);
  }).toPass();

export { getItemForm, makeItem, getLatex, mockScene, whenMathboxRendered };
