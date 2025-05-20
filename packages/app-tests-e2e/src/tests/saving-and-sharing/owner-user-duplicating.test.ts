import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

const user = makeUserInfo();
test.use({ user });
test.setTimeout(60_000);

test("Saving an existing scene scene", async ({ page, prepareScene }) => {
  const scene = new SceneBuilder();
  const initialDescription = faker.lorem.words(3);
  scene //
    .folder({ description: "Folder 1" })
    .point({ description: initialDescription });
  const newTitle = `My ${scene.title}`;

  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  await app.getUniqueItemSettings({ description: initialDescription });

  await test.step("Save scene", async () => {
    await app
      .header()
      .getByRole("button", { name: "Other Saving Options" })
      .click();
    await page.getByRole("menuitem", { name: "Duplicate" }).click();
    const dialog = page.getByRole("dialog", { name: "Save a Copy" });
    const title = dialog.getByRole("textbox", { name: "Title" });
    await expect(title).toHaveValue(`Copy of ${scene.title}`);
    await title.fill(newTitle);
    await dialog.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Success dialog", async () => {
    const dialog = page.getByRole("dialog", { name: "Scene Saved!" });
    await expect(dialog).toBeVisible();
    const url = await dialog
      .getByRole("textbox", { name: "Shareable URL" })
      .inputValue();

    await dialog.getByRole("button", { name: "OK" }).click();
    await expect(dialog).not.toBeVisible();

    await expect(
      page.getByRole("alert").filter({ hasText: "Saved!" }),
    ).toBeVisible();

    // Check that saving updated the current URL
    await expect(page.url()).toBe(url);
    await expect(app.sceneTitle()).toHaveValue(newTitle);
    return url;
  });

  await test.step("Reload saved scene", async () => {
    await page.reload();
    await expect(app.sceneTitle()).toHaveValue(newTitle);
  });
  await test.step("Check old title same", async () => {
    await page.goto(`/${key}`);
    await expect(app.sceneTitle()).toHaveValue(scene.title);
  });
});
