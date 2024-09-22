import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

const user = makeUserInfo();
test.use({ user });

test("Saving a new scene", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  const title = faker.lorem.words(3);
  const item = await app.getUniqueItemSettings("Explicit Surface");
  const newDescription = faker.lorem.words(3);

  await test.step("Making a change enables saving", async () => {
    await expect(app.saveButton()).toBeDisabled();
    await expect(app.saveButton()).toHaveAccessibleName("Save");

    await item.field("description").fill(newDescription);

    await expect(app.saveButton()).toBeEnabled();
    await expect(app.saveButton()).toHaveAccessibleName("Save");
  });

  await test.step("Save scene", async () => {
    await app.saveButton().click();
    const dialog = page.getByRole("dialog", { name: "Save Scene" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("dialog");
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
    await expect(app.sceneTitle()).toHaveValue(title);
    return url;
  });

  await test.step("Reload saved scene", async () => {
    await page.reload();
    await expect(app.sceneTitle()).toHaveValue(title);
    await expect(item.field("description")).toHaveValue(newDescription);
  });
});

test("Saving an existing scene scene", async ({ page, prepareScene }) => {
  const scene = new SceneBuilder();
  const initialDescription = faker.lorem.words(3);
  const newDescription = faker.lorem.words(3);
  scene //
    .folder({ description: "Folder 1" })
    .point({ description: initialDescription });

  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings(initialDescription);

  await test.step("Making a change enables saving", async () => {
    await expect(app.saveButton()).toBeDisabled();
    await expect(app.saveButton()).toHaveAccessibleName("Save");

    await item.field("description").fill(newDescription);

    await expect(app.saveButton()).toBeEnabled();
    await expect(app.saveButton()).toHaveAccessibleName("Save");
  });

  await test.step("Save scene", async () => {
    await app.saveButton().click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Saved!" }),
    ).toBeVisible();
    await expect(item.root).toBeVisible();
  });

  await test.step("Reload saved scene", async () => {
    await page.reload();
    await expect(item.field("description")).toHaveValue(newDescription);
  });
});
