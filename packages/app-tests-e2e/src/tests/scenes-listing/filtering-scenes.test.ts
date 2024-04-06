import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { faker } from "@faker-js/faker";

test.use({ user: "dynamic" });

test.only("Filtering scenes by titles", async ({ page, prepareScene }) => {
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

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();

  await sceneItem1.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitem", { name: "Archive" }).click();

  await expect(sceneItem1).not.toBeVisible();
  await expect(sceneItem2).toBeVisible();

  await page.getByRole("checkbox", { name: "Include archived" }).click();

  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();
});
