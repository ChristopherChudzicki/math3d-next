import type { Locator, Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

type Press = (locator: Locator) => Promise<void>;

const makeScene = () => {
  const scene = new SceneBuilder();
  scene.folder().point({}, "the_point");
  return scene;
};

const typesThroughVirtualKeyboard = async (
  page: Page,
  sceneKey: string,
  press: Press,
) => {
  await page.goto(`/${sceneKey}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({ id: "the_point" });
  const moreSettings = item.moreSettings();
  await moreSettings.opener().click();
  const zBias = moreSettings.root.getByLabel("Z-Bias", { exact: true });
  await zBias.click();
  await expect(zBias).toBeFocused();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");

  await press(page.getByRole("button", { name: "Enable math keyboard" }));
  const keyboard = page.locator(".ML__keyboard");
  await expect(keyboard).toBeVisible();
  await press(keyboard.getByLabel("7", { exact: true }));
  await press(keyboard.getByLabel("+", { exact: true }));
  await press(keyboard.getByLabel("2", { exact: true }));

  await expect(moreSettings.root).toBeVisible();
  await expect(zBias).toBeFocused();
  await expect(zBias).toHaveJSProperty("value", "7+2");
};

test("Typing into a settings popover with the virtual keyboard", async ({
  page,
  prepareScene,
}) => {
  const key = await prepareScene(makeScene());
  await typesThroughVirtualKeyboard(page, key, (locator) => locator.click());
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true });

  test("Typing into a settings popover with the virtual keyboard", async ({
    page,
    prepareScene,
  }) => {
    const key = await prepareScene(makeScene());
    await typesThroughVirtualKeyboard(page, key, (locator) => locator.tap());
  });
});
