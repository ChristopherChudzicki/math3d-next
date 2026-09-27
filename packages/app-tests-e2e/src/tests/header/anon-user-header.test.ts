import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";

test("Does not show username", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);

  // The hamburger: an avatar would offer an account affordance to a visitor
  // who has no account, next to the header's own "Sign in" button.
  const trigger = app.userMenu().hamburgerOpener();
  await expect(trigger).toBeVisible();
  await expect(app.userMenu().avatarOpener()).toHaveCount(0);
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
    "Examples",
    "Function Reference",
    "Contact",
  ]);
});
