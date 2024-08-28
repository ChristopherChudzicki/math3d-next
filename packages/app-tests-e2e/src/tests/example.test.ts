import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import env from "@/env";
import { faker } from "@faker-js/faker/locale/en";

test("Anonymous user", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  await app.userMenu().opener().click();
  const username = app.userMenu().username();
  await expect(username).not.toBeVisible();
});

test.describe("Authorized user (static)", () => {
  test.use({ user: "static" });

  test("Check user info", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);
    await app.userMenu().opener().click();
    const username = app.userMenu().username();
    expect(await username.textContent()).toBe(env.TEST_USER_STATIC_EMAIL);
  });
});

test.describe("Authorized user (dynamic)", () => {
  const email = faker.internet.email();
  test.use({ user: { email } });

  test("Check user info", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);
    await app.userMenu().opener().click();
    const username = app.userMenu().username();
    expect(await username.textContent()).toBe(email);
  });

  test("Building a custom scene", async ({ page, prepareScene }) => {
    const scene = new SceneBuilder();
    scene //
      .folder({ description: "Folder 1" })
      .point({ color: "orange", coords: "[1, 2, 3]" });
    const key = await prepareScene(scene);
    await page.goto(`/${key}`);
  });
});
