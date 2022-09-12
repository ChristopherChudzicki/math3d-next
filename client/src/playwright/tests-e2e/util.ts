import { MathItem } from "@/configs";
import type { Locator, Page } from "@playwright/test";
import type { Mathfield } from "mathlive";
/**
 * Importing from "@/test_util" includes some TSX which Playwright can't handle,
 * so need to import the TS-only files directly
 */
import { makeItem } from "@/test_util/makeItem";

const getItemForm = (page: Page, item: MathItem): Locator => {
  return page.locator(
    `css=form[aria-label="Settings for ${item.properties.description}"]`
  );
};

/**
 * Check whether the $pw helpers exist on window yet.
 */
const pwHelpersExist = (page: Page) => () =>
  page.evaluate(() => window.$pw !== undefined);

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

export { getItemForm, makeItem, pwHelpersExist, getLatex };
