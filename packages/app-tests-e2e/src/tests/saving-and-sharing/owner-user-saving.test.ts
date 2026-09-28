import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test.use({ user: "worker" });
test.setTimeout(60_000);

test("Saving a new scene", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  const title = faker.lorem.words(3);
  const item = await app.getUniqueItemSettings({
    description: "Explicit Surface",
  });
  const newDescription = faker.lorem.words(3);

  await test.step("Making a change enables saving", async () => {
    await expect(app.sceneAction()).toBeDisabled();
    await expect(app.sceneAction()).toHaveAccessibleName("Save");

    await item.field("description").fill(newDescription);

    await expect(app.sceneAction()).toBeEnabled();
    await expect(app.sceneAction()).toHaveAccessibleName("Save");
  });

  await test.step("Save scene", async () => {
    await app.sceneAction().click();
    const dialog = page.getByRole("dialog", { name: "Save scene" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Save" }).click();
  });

  await test.step("Success dialog", async () => {
    const dialog = page.getByRole("dialog", { name: "Scene saved!" });
    await expect(dialog).toBeVisible();
    const url = await dialog
      .getByRole("textbox", { name: "Shareable URL" })
      .inputValue();

    await dialog.getByRole("button", { name: "Done" }).click();
    await expect(dialog).not.toBeVisible();

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

  const item = await app.getUniqueItemSettings({
    description: initialDescription,
  });

  await test.step("Making a change enables saving", async () => {
    await expect(app.sceneAction()).toHaveAccessibleName("Copy link");

    await item.field("description").fill(newDescription);

    await expect(app.sceneAction()).toBeEnabled();
    await expect(app.sceneAction()).toHaveAccessibleName("Save");
  });

  await test.step("Save scene", async () => {
    await app.sceneAction().click();
    await expect(app.sceneAction()).toHaveAccessibleName("Saved!");
    await expect(item.root).toBeVisible();
  });

  await test.step("Reload saved scene", async () => {
    await page.reload();
    await expect(item.field("description")).toHaveValue(newDescription);
  });
});

test("Saving a new scene keeps the active item selected", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({
    description: "Explicit Surface",
  });

  await item.field("description").fill(faker.lorem.words(3));
  await expect(item.activeMarker()).toHaveCount(1);

  await app.sceneAction().click();
  const dialog = page.getByRole("dialog", { name: "Save scene" });
  await dialog
    .getByRole("textbox", { name: "Title" })
    .fill(faker.lorem.words(3));
  await dialog.getByRole("button", { name: "Save" }).click();
  await page
    .getByRole("dialog", { name: "Scene saved!" })
    .getByRole("button", { name: "Done" })
    .click();

  // Publishing moves to the new key without reloading the scene, so the
  // selection survives.
  await expect(page).toHaveURL(/\/[^/]+$/);
  await expect(item.activeMarker()).toHaveCount(1);
});
