import type { Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { getItemForm, getLatex } from "@/utils/selectors";
import { SceneBuilder } from "@math3d/mock-api";

test.use({ user: {} });

test("Typing arrays into an empty <math-field />", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder().point({
    description: "SomePoint",
    coords: "",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);

  const form = getItemForm(page, "SomePoint");
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
  await page.goto(`/`);
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
