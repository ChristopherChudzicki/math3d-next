import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserIdentity();
test.use({ user });

test("Choosing a scene keeps the drawer open beside it, and closes the drawer once it covers the scene", async ({
  page,
  prepareScene,
}) => {
  const scene1 = new SceneBuilder();
  const scene2 = new SceneBuilder();
  const [key1, key2] = await Promise.all([
    prepareScene(scene1.json()),
    prepareScene(scene2.json()),
  ]);
  // The drawer is 672px wide.
  await page.setViewportSize({ width: 673, height: 900 });
  const myScenes = new AppPage(page).myScenes();
  await myScenes.goTo();
  await myScenes.assertReady();
  const drawer = page.getByRole("dialog", { name: "Scenes" });

  await drawer.getByRole("link", { name: scene1.title }).click();
  await expect(page).toHaveURL(new RegExp(`/${key1}\\?overlay=scenes`));
  await expect(drawer).toBeVisible();

  await page.setViewportSize({ width: 672, height: 900 });
  await drawer.getByRole("link", { name: scene2.title }).click();
  await expect(page).toHaveURL(new RegExp(`/${key2}$`));
  await expect(drawer).toBeHidden();
  await expect(page.getByRole("button", { name: "Open scenes" })).toBeFocused();
});
