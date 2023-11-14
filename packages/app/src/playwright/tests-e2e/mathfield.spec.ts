import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { MathItemType as MIT } from "@math3d/mathitem-configs";

import { makeItem, sceneFromItems } from "@/test_util/factories";
import { getItemForm, getLatex } from "./util";

test("Typing arrays into an empty <math-field />", async ({ page }) => {
  const point = makeItem(MIT.Point, { description: "SomePoint", coords: "" });
  const scene = sceneFromItems([point]);
  await page.route(`*/**/v0/scenes/${scene.key}/`, async (route) => {
    await route.fulfill({ json: scene });
  });

  await page.addInitScript(() => {
    window.$pwCustomSeed = true;
  });

  await page.goto(`/${scene.key}`);

  const form = getItemForm(page, point);
  const mf = await form.locator('css=[aria-label="Coordinates"]');
  await mf.type("[1,2,3,]");
  expect(await mf.evaluate(getLatex)).toBe(
    String.raw`\left\lbrack1,2,3,\right\rbrack`,
  );
});

const activeElement = (page: Page) =>
  page.evaluate(() => document.activeElement?.tagName);

test("Toggling keyboard visibility auto-focuses a math-field and shows virtual keyboard when focused", async ({
  page,
}) => {
  await page.goto("");
  await expect(activeElement(page)).resolves.toBe("BODY");
  const toggler = page.getByTestId("toggle-keyboard-button");

  /**
   * Turn "auto-expand" ON
   */
  await toggler.click();

  // Arrow points "down" now
  await expect(toggler.getByTestId("KeyboardArrowDownIcon")).toBeVisible();
  await expect(toggler.getByTestId("KeyboardArrowUpIcon")).toHaveCount(0);
  // Toggling the keyboard should auto-focus a mathfield
  await expect(activeElement(page)).resolves.toBe("MATH-FIELD");
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // Clicking away should hide the virtual keyboard
  await page.getByTestId("scene").click();
  await expect(page.locator(".ML__keyboard")).toHaveCount(0);

  // Clicking on the math-field should show the virtual keyboard
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // We add a CSS transition to the backdrop, so double check that it actually exists
  await expect(page.locator(".ML__keyboard > .MLK__backdrop")).toHaveCount(1);

  /**
   * Turn "auto-expand" OFF
   */
  await page.getByTestId("toggle-keyboard-button").click();
  // Arrow points "up" now.
  await expect(toggler.getByTestId("KeyboardArrowDownIcon")).toHaveCount(0);
  await expect(toggler.getByTestId("KeyboardArrowUpIcon")).toBeVisible;
  await expect(page.locator(".ML__keyboard")).toHaveCount(0);
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toHaveCount(0);
});
