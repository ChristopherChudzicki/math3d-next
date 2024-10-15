import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import { faker } from "@faker-js/faker";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserInfo();
test.use({ user });

test("Filtering scenes by titles", async ({ page, prepareScene }) => {
  const suffix = faker.string.uuid();
  const scene1 = new SceneBuilder({ title: `scene-1-${suffix}` });
  const scene2 = new SceneBuilder({ title: `scene-2-${suffix}` });
  const scene3 = new SceneBuilder({ title: `scene-3` });
  await Promise.all([
    prepareScene(scene1.json()),
    prepareScene(scene2.json()),
    prepareScene(scene3.json()),
  ]);

  const app = new AppPage(page);
  const myScenes = app.myScenes();

  await myScenes.goTo();
  await myScenes.assertReady();

  const sceneItem1 = myScenes.sceneItem(scene1.title);
  const sceneItem2 = myScenes.sceneItem(scene2.title);
  const sceneItem3 = myScenes.sceneItem(scene3.title);

  await expect(sceneItem1.root).toBeVisible();
  await expect(sceneItem2.root).toBeVisible();
  await expect(sceneItem3.root).toBeVisible();

  await myScenes.field("Filter scenes").fill(suffix);

  await expect(page.getByRole("listitem")).toHaveCount(2);
  await expect(sceneItem1.root).toBeVisible();
  await expect(sceneItem2.root).toBeVisible();
  await expect(sceneItem3.root).toHaveCount(0);
});

test("Archiving and unarchiving scenes", async ({ page, prepareScene }) => {
  const scene1 = new SceneBuilder();
  const scene2 = new SceneBuilder();
  await Promise.all([prepareScene(scene1.json()), prepareScene(scene2.json())]);

  const app = new AppPage(page);
  const myScenes = app.myScenes();

  await myScenes.goTo();
  await myScenes.assertReady();

  const sceneItem1 = myScenes.sceneItem(scene1.title);
  const sceneItem2 = myScenes.sceneItem(scene2.title);

  const includeArchived = myScenes.field("Include archived");
  await expect(includeArchived).not.toBeChecked();

  await expect(sceneItem1.root).toBeVisible();
  await expect(sceneItem2.root).toBeVisible();

  await sceneItem1.menuTrigger().click();
  await sceneItem1.menuItem.archive().click();

  await expect(sceneItem1.root).not.toBeVisible();
  await expect(sceneItem2.root).toBeVisible();

  await includeArchived.click();
  await expect(includeArchived).toBeChecked();

  await expect(sceneItem1.root).toBeVisible();
  await expect(sceneItem1.root).toContainText("Archived");
  await expect(sceneItem2.root).toBeVisible();

  await sceneItem1.menuTrigger().click();
  await sceneItem1.menuItem.unarchive().click();

  await includeArchived.click();
  await expect(includeArchived).not.toBeChecked();

  await expect(sceneItem1.root).toBeVisible();
  await expect(sceneItem1.root).not.toContainText("Archived");
  await expect(sceneItem2.root).toBeVisible();
});
