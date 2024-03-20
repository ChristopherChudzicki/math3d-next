import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import env from "@/env";

test.use({ user: "static" });

test("Signing out", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  await expect(app.userMenu().opener()).toHaveText("S");
  await app.userMenu().opener().click();
  const username = app.userMenu().username();
  expect(await username.textContent()).toBe(env.TEST_USER_STATIC_EMAIL);
  await app.userMenu().signout().click();
  await app.signoutPage().confirm().click();

  await app.assertSignedOut();
});
