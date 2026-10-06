import type { Locator, Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import type ItemSettings from "@/utils/pages/ItemSettings";

const makeScene = () => {
  const scene = new SceneBuilder();
  scene.folder().point({}, "the_point");
  return scene;
};

/** Opens the point's settings and focuses its emptied Z-Bias field. */
const focusEmptySettingsField = async (
  page: Page,
  sceneKey: string,
  press: (locator: Locator) => Promise<void>,
) => {
  await page.goto(`/${sceneKey}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({ id: "the_point" });
  const moreSettings = item.moreSettings();
  await moreSettings.opener().click();
  const zBias = moreSettings.root.getByLabel("Z-Bias", { exact: true });
  await press(zBias);
  await expect(zBias).toBeFocused();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  return { moreSettings, zBias };
};

const typeOnVirtualKeyboard = async (
  page: Page,
  press: (locator: Locator) => Promise<void>,
) => {
  const keyboard = page.locator(".ML__keyboard");
  await expect(keyboard).toBeVisible();
  await press(keyboard.getByLabel("7", { exact: true }));
  await press(keyboard.getByLabel("+", { exact: true }));
  await press(keyboard.getByLabel("2", { exact: true }));
};

const expectTypedIntoOpenPopover = async (
  moreSettings: ReturnType<ItemSettings["moreSettings"]>,
  zBias: Locator,
) => {
  await expect(moreSettings.root).toBeVisible();
  await expect(zBias).toBeFocused();
  await expect(zBias).toHaveJSProperty("value", "7+2");
};

test("Typing into a settings popover with the virtual keyboard", async ({
  page,
  prepareScene,
}) => {
  const key = await prepareScene(makeScene());
  const click = (locator: Locator) => locator.click();
  const { moreSettings, zBias } = await focusEmptySettingsField(
    page,
    key,
    click,
  );

  await page.getByRole("button", { name: "Enable math keyboard" }).click();
  await typeOnVirtualKeyboard(page, click);

  await expectTypedIntoOpenPopover(moreSettings, zBias);
  await moreSettings.root.getByRole("button", { name: "Close" }).click();
  await expect(moreSettings.opener()).toBeFocused();
});

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true });

  test("Typing into a settings popover with the virtual keyboard", async ({
    page,
    prepareScene,
  }) => {
    const key = await prepareScene(makeScene());
    const tap = (locator: Locator) => locator.tap();
    // On touch screens, MathLive shows its keyboard when a field is focused.
    const { moreSettings, zBias } = await focusEmptySettingsField(
      page,
      key,
      tap,
    );

    await typeOnVirtualKeyboard(page, tap);

    await expectTypedIntoOpenPopover(moreSettings, zBias);
  });
});
