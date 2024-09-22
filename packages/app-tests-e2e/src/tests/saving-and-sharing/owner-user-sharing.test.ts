import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { makeUserInfo } from "@math3d/mock-api";

const user = makeUserInfo();
test.use({ user });

test("Sharing before save...just like anon users", () => {});

test("Sharing previously saved... ", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  const url = page.url();

  await test.step("Share without editing... no warning", async () => {
    const shareButton = app.sharePopover().trigger();
    await shareButton.click();
    await expect(app.sharePopover().shareableUrl()).toHaveValue(url);
    await expect(app.sharePopover().region()).toBeVisible();
    await expect(
      app.sharePopover().region().getByRole("alert"),
    ).not.toBeVisible();
    await app.sharePopover().close();
  });

  await test.step("Share with edit...warn unsaved changes", async () => {
    const description = faker.lorem.words();
    const item = await app.getUniqueItemSettings("Explicit Surface");
    await item.field("description").fill(description);

    const shareButton = app.sharePopover().trigger();
    await shareButton.click();
    await expect(app.sharePopover().shareableUrl()).toHaveValue(url);
    await expect(app.sharePopover().region()).toBeVisible();
    await expect(app.sharePopover().region().getByRole("alert")).toBeVisible();
  });
});
