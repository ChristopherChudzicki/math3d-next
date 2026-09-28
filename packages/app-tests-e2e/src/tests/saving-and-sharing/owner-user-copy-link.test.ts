import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test.use({ user: "worker" });
test.setTimeout(60_000);

test("An owner saves, then copies the scene's link", async ({
  page,
  prepareScene,
}) => {
  // Not the `context` fixture: a signed-in `page` has a context of its own.
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const description = faker.lorem.words(3);
  const scene = new SceneBuilder();
  scene.folder().point({ description });
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({ description });

  await item.field("description").fill(faker.lorem.words(3));
  await expect(app.sceneAction()).toHaveAccessibleName("Save");
  await app.sceneAction().click();
  await expect(app.sceneAction()).toHaveAccessibleName("Saved!");

  await expect(app.sceneAction()).toHaveAccessibleName("Copy link");
  await app.sceneAction().click();
  await expect(app.sceneAction()).toHaveAccessibleName("Copied!");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    page.url(),
  );
});
