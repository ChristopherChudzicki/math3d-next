import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { faker } from "@faker-js/faker";

test.use({ user: "dynamic" });

test("Filtering scenes by titles", async ({ page, prepareScene }) => {
  const suffix = faker.datatype.uuid();
  const scene1 = new SceneBuilder({ title: `scene-1-${suffix}` });
  const scene2 = new SceneBuilder({ title: `scene-2-${suffix}` });
  const scene3 = new SceneBuilder({ title: `scene-3` });
  await Promise.all([
    prepareScene(scene1.json()),
    prepareScene(scene2.json()),
    prepareScene(scene3.json()),
  ]);

  await page.goto(`/scenes/me`);
  const sceneItem1 = page.getByRole("listitem").filter({
    hasText: scene1.title,
  });
  const sceneItem2 = page.getByRole("listitem").filter({
    hasText: scene2.title,
  });
  const sceneItem3 = page.getByRole("listitem").filter({
    hasText: scene3.title,
  });

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();
  await expect(sceneItem3).toBeVisible();

  await page.getByRole("textbox", { name: "Filter scenes" }).fill(`${suffix}`);
  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();
  await expect(sceneItem3).toHaveCount(0);
});

test("Archiving and unarchiving scenes", async ({ page, prepareScene }) => {
  const scene1 = new SceneBuilder();
  const scene2 = new SceneBuilder();
  await Promise.all([prepareScene(scene1.json()), prepareScene(scene2.json())]);

  await page.goto(`/scenes/me`);
  const sceneItem1 = page.getByRole("listitem").filter({
    hasText: scene1.title,
  });
  const sceneItem2 = page.getByRole("listitem").filter({
    hasText: scene2.title,
  });
  const includeArchived = page.getByRole("checkbox", {
    name: "Include archived",
  });

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();

  await sceneItem1.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();

  await expect(sceneItem1).not.toBeVisible();
  await expect(sceneItem2).toBeVisible();

  includeArchived.click();
  await expect(includeArchived).toBeChecked();

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem1).toContainText("Archived");
  await expect(sceneItem2).toBeVisible();

  await sceneItem1.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitem", { name: "Unarchive" }).click();

  await includeArchived.click();
  await expect(includeArchived).not.toBeChecked();

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem1).not.toContainText("Archived");
  await expect(sceneItem2).toBeVisible();
});
