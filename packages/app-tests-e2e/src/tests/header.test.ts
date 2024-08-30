import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { makeUserInfo } from "@math3d/mock-api";

test.describe("Authorized user header", () => {
  const user = makeUserInfo();
  test.use({ user });

  test("Shows username in usermenu", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);

    const trigger = await app.userMenu().opener();
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveText(user.public_nickname[0]);

    await trigger.click();
    const username = app.userMenu().username();
    await expect(username).toHaveText(user.email);
  });

  test("Header and usermenu links", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);

    await app.userMenu().opener().click();

    await expect(app.userMenu().items()).toHaveText([
      "My Scenes",
      "Examples",
      "Contact",
      "Account Settings",
      "Sign out",
    ]);
  });
});

test.describe("Anonymous user header", () => {
  test("Does not show username", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);

    const trigger = await app.userMenu().opener();
    await expect(trigger).toBeVisible();
    expect(await trigger.textContent()).toBe("");

    await trigger.click();
    const username = app.userMenu().username();
    await expect(username).not.toBeVisible();
  });

  test("Header and usermenu links", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);
    await app.userMenu().opener().click();
    await expect(app.userMenu().items()).toHaveText([
      "Sign in",
      "Sign up",
      "Examples",
      "Contact",
    ]);
  });
});
