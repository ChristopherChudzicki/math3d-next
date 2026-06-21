import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";

test.use({ user: "worker" });

test("Shows username in usermenu", async ({ page, workerUser }) => {
  await page.goto("");
  const app = new AppPage(page);

  const trigger = await app.userMenu().opener();
  await expect(trigger).toBeVisible();
  await expect(trigger).toHaveText(workerUser.info.public_nickname[0]);

  await trigger.click();
  const username = app.userMenu().username();
  await expect(username).toHaveText(workerUser.info.email);
});

test("Header and usermenu links", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);

  await app.userMenu().opener().click();

  await expect(app.userMenu().items()).toHaveText([
    "My Scenes",
    "Examples",
    "Function Reference",
    "Contact",
    "Account Settings",
    "Sign out",
  ]);
});
