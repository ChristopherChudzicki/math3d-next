import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import env from "@/env";

test.describe("Authorized user header", () => {
  test.use({ user: "dynamic" });

  test("Shows username in usermenu", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);

    const trigger = await app.userMenu().opener();
    await expect(trigger).toBeVisible();
    expect(await trigger.textContent()).toBe("D");

    await trigger.click();
    const username = app.userMenu().username();
    expect(await username.textContent()).toBe(env.TEST_USER_DYNAMIC_EMAIL);
  });

  test("Header and usermenu links", async ({ page }) => {
    await page.goto("");
    const app = new AppPage(page);

    await app.userMenu().opener().click();

    expect(await app.userMenu().items().allTextContents()).toEqual([
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
    expect(await app.userMenu().items().allTextContents()).toEqual([
      "Sign in",
      "Sign up",
      "Examples",
      "Contact",
    ]);
  });
});
