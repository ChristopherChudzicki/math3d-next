import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

const editAndStartSignIn = async (
  app: AppPage,
  description: string,
  edited: string,
) => {
  const item = await app.getUniqueItemSettings({ description });
  await item.field("description").fill(edited);
  await app.userMenu().opener().click();
  await app.userMenu().signin().click();
  await app.loginDialog().devSignIn().click();
  return item;
};

test("Cancelling at the provider returns to the editor with the edit and a notice", async ({
  page,
  getPrepareScene,
}) => {
  const initial = faker.lorem.words(3);
  const edited = faker.lorem.words(3);
  const scene = new SceneBuilder();
  scene.folder().point({ description: initial });
  const key = await getPrepareScene({ sessionCookies: null })(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await editAndStartSignIn(app, initial, edited);
  await app.dummyProvider().cancel();

  await expect(app.loginDialog().root).toContainText("Sign-in was cancelled.");
  await app.loginDialog().root.press("Escape");
  await expect(item.field("description")).toHaveValue(edited);
});

test("Back from the provider keeps the edit", async ({
  page,
  getPrepareScene,
}) => {
  const initial = faker.lorem.words(3);
  const edited = faker.lorem.words(3);
  const scene = new SceneBuilder();
  scene.folder().point({ description: initial });
  const key = await getPrepareScene({ sessionCookies: null })(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await editAndStartSignIn(app, initial, edited);
  await expect(page).toHaveURL(/dummy\/authenticate/);
  await page.goBack();

  // Playwright's Chromium runs without the back/forward cache, so this is the
  // reload path: the draft, matched by pathname, restores the edit.
  await expect(app.loginDialog().root).toBeVisible();
  await expect(item.field("description")).toHaveValue(edited);
});
