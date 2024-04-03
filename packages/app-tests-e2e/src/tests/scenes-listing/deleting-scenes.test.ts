import type { Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { getItemForm, getLatex } from "@/utils/selectors";
import { SceneBuilder } from "@math3d/mock-api";

test.use({ user: "dynamic" });

test("Typing arrays into an empty <math-field />", async ({
  page,
  prepareScene,
}) => {
  const scene1 = new SceneBuilder();
  const scene2 = new SceneBuilder();
  const key1 = await Promise.all([
    prepareScene(scene1.json()),
    prepareScene(scene2.json()),
  ]);

  await page.goto(`/scenes/me`);
  const sceneItem1 = page.getByRole("listitem").filter({
    hasText: scene1.title,
  });
  const sceneItem2 = page.getByRole("listitem").filter({
    hasText: scene1.title,
  });
  await expect(sceneItem1).toBeVisible();
  await expect(sceneItem2).toBeVisible();
  await sceneItem1.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete scene?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm" }).click();

  await expect(sceneItem1).toHaveCount(0);
  await expect(sceneItem2).toBeVisible();
});
