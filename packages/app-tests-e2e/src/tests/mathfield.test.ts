import type { Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserInfo();
test.use({ user });

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
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({ description: "SomePoint" });
  const mf = item.field("Coordinates");
  await mf.type("[1,2,3,]");
  await expect(mf).toHaveJSProperty(
    "value",
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
  await expect(toggler.getByTestId("KeyboardArrowUpIcon")).toBeHidden();
  // Toggling the keyboard should auto-focus a mathfield
  await expect(activeElement(page)).resolves.toBe("MATH-FIELD");
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // Clicking away should hide the virtual keyboard
  await page.getByTestId("scene").click();
  await expect(page.locator(".ML__keyboard")).toBeHidden();

  // Clicking on the math-field should show the virtual keyboard
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // We add a CSS transition to the backdrop, so double check that it actually exists
  await expect(page.locator(".ML__keyboard > .MLK__backdrop")).toBeVisible();

  /**
   * Turn "auto-expand" OFF
   */
  await page.getByTestId("toggle-keyboard-button").click();
  // Arrow points "up" now.
  await expect(toggler.getByTestId("KeyboardArrowDownIcon")).toBeHidden();
  await expect(toggler.getByTestId("KeyboardArrowUpIcon")).toBeVisible();
  await expect(page.locator(".ML__keyboard")).toBeHidden();
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toBeHidden();
});
