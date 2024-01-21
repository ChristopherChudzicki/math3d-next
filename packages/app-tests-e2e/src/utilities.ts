import type { Page, Locator } from "@playwright/test";
import type { Mathfield } from "mathlive";
import { expect } from "@playwright/test";

const getItemForm = (page: Page, description: string): Locator => {
  return page.locator(`css=form[aria-label="Settings for ${description}"]`);
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

/**
 * Resolves when mathbox has rendered.
 */
const whenMathboxRendered = (page: Page) =>
  expect(async () => {
    const exists = await page.evaluate(
      () =>
        // @ts-expect-error We assign mathbox to window, but leaving it off
        // the type definitions to discourage use outside of debugging.
        !!window.mathbox,
    );
    expect(exists).toBe(true);
  }).toPass();

export { getItemForm, getLatex, whenMathboxRendered };
