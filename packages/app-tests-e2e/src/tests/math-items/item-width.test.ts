import { test } from "@/fixtures/users";
import { expect, type Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import type ItemSettings from "@/utils/pages/ItemSettings";

const nextFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );

const widens = async (item: ItemSettings, focus: () => Promise<void>) => {
  const narrow = await item.root.boundingBox();
  await focus();
  await expect
    .poll(async () => (await item.root.boundingBox())?.width)
    .toBeGreaterThan(narrow?.width ?? Infinity);
};

["Description", "Coordinates"].forEach((field) => {
  test(`Focusing ${field} of an item with a long description doesn't resize it`, async ({
    page,
    prepareScene,
  }) => {
    const description =
      "A description long enough to wrap across several lines of the sidebar";
    const scene = new SceneBuilder();
    scene.folder().point({ description }, "point");
    const key = await prepareScene(scene);
    await page.goto(`/${key}`);
    const item = await new AppPage(page).getUniqueItemSettings({ id: "point" });
    // The description renders empty first, and MathLive's fonts load late.
    await expect(item.field("Description")).toHaveValue(description);
    await page.evaluate(() => document.fonts.ready);

    const before = await item.root.boundingBox();
    await item.field(field).click();
    await expect(item.field(field)).toBeFocused();
    await nextFrames(page);
    expect(await item.root.boundingBox()).toEqual(before);
  });
});

test("The settings button of a widened item opens its settings", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .point({ coords: `[${Array(40).fill(1).join("+")}, 0, 0]` }, "point");
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const item = await new AppPage(page).getUniqueItemSettings({ id: "point" });

  await widens(item, () => item.field("Coordinates").click());
  const moreSettings = item.moreSettings();
  await moreSettings.opener().click();
  await expect(moreSettings.root).toBeVisible();
});

test("A switch in a widened item toggles", async ({ page, prepareScene }) => {
  const scene = new SceneBuilder();
  scene.folder().booleanVariable(
    {
      value: {
        type: "assignment",
        lhs: `s_{${"1".repeat(60)}}`,
        rhs: "true",
      },
    },
    "toggle",
  );
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const item = await new AppPage(page).getUniqueItemSettings({ id: "toggle" });

  await widens(item, () => item.field("Switch name").click());
  const toggle = item.root.getByRole("switch");
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
});
