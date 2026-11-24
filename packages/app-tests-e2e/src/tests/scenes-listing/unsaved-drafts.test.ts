import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test.use({ user: "worker" });

const draftCount = (page: Page) =>
  page.evaluate(
    () =>
      Object.keys(localStorage).filter((k) => k.startsWith("math3d:draft:"))
        .length,
  );

// The open button's name starts with the title; its delete button's doesn't.
const draftName = (title: string) => new RegExp(`^Changes to ${title}`);

const openUnsavedTab = async (page: Page) => {
  await page.getByRole("button", { name: "Open scenes" }).click();
  await page.getByRole("tab", { name: /^Unsaved/ }).click();
};

test("Unsaved edits survive a reload in the Unsaved tab", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  const initialDescription = faker.lorem.words(3);
  const newDescription = faker.lorem.words(3);
  scene.folder().point({ description: initialDescription });
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({
    description: initialDescription,
  });

  await test.step("An edit is kept as a draft", async () => {
    await item.field("description").fill(newDescription);
    await expect.poll(() => draftCount(page)).toBe(1);
  });

  await test.step("Reloading shows the saved scene", async () => {
    await page.reload();
    await expect(item.field("description")).toHaveValue(initialDescription);
  });

  await test.step("Opening the draft brings the edit back, unsaved", async () => {
    await openUnsavedTab(page);
    await page.getByRole("button", { name: draftName(scene.title) }).click();

    await expect(page).toHaveURL(new RegExp(`/${key}$`));
    await expect(item.field("description")).toHaveValue(newDescription);
    await expect(app.sceneAction()).toHaveAccessibleName("Save");
  });

  await test.step("Reloading again still leaves a single draft", async () => {
    await page.reload();
    await expect(item.field("description")).toHaveValue(initialDescription);
    await openUnsavedTab(page);
    await expect(
      page.getByRole("button", { name: draftName(scene.title) }),
    ).toHaveCount(1);
  });
});
