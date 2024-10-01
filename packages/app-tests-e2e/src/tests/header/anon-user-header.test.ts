import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { makeUserInfo } from "@math3d/mock-api";

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
