import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test("Anon users can share but not save", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);

  const description = faker.lorem.words();
  const item = await app.getUniqueItemSettings({
    description: "Explicit Surface",
  });
  await item.field("description").fill(description);

  // Anon users get no 'Save' button
  const shareButton = app.sharePopover().trigger();
  await expect(app.saveButton()).not.toBeVisible();
  await expect(shareButton).toBeVisible();

  await shareButton.click();
  await expect(app.sharePopover().shareableUrl()).not.toBeEmpty();
  const url = await page.getByLabel("Shareable URL").inputValue();
  expect(page.url()).toBe(url);
});
