import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import type { Fixtures } from "@/fixtures/users";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserInfo();
test.use({ user });
test.setTimeout(60_000);

test.describe("Deleting a scene", async () => {
  const setup = async (
    { page, prepareScene }: Pick<Fixtures, "page" | "prepareScene">,
    confirm: boolean,
  ) => {
    const scene1 = new SceneBuilder();
    const scene2 = new SceneBuilder();
    const [key1, _key2] = await Promise.all([
      prepareScene(scene1.json(), { allowCleanup404: confirm }),
      prepareScene(scene2.json()),
    ]);

    const app = new AppPage(page);
    const myScenes = app.myScenes();

    await myScenes.goTo();
    await myScenes.assertReady();

    const sceneItem1 = myScenes.sceneItem(scene1.title);
    const sceneItem2 = myScenes.sceneItem(scene2.title);
    await expect(sceneItem1.root).toBeVisible();
    await expect(sceneItem2.root).toBeVisible();
    await sceneItem1.menuTrigger().click();
    await sceneItem1.menuItem.delete().click();
    const dialog = page.getByRole("dialog", { name: "Delete scene?" });
    await expect(dialog).toBeVisible();
    if (confirm) {
      await dialog.getByRole("button", { name: "Confirm" }).click();
    } else {
      await dialog.getByRole("button", { name: "Cancel" }).click();
    }

    return { scene1, scene2, sceneItem1, sceneItem2, key1 };
  };

  test("Deletes scene when confirmed", async ({ page, prepareScene }) => {
    const { sceneItem1, sceneItem2, key1 } = await setup(
      { page, prepareScene },
      true,
    );
    await expect(sceneItem2.root).toBeVisible();
    await expect(sceneItem1.root).toHaveCount(0);

    await page.goto(`/${key1}`);
    await expect(page.getByRole("dialog", { name: "Not found" })).toBeVisible();
  });

  test("Does not delete scene when canceled", async ({
    page,
    prepareScene,
  }) => {
    const { scene1, sceneItem1, sceneItem2, key1 } = await setup(
      { page, prepareScene },
      false,
    );
    await expect(sceneItem1.root).toBeVisible();
    await expect(sceneItem2.root).toBeVisible();

    await page.goto(`/${key1}`);

    const app = new AppPage(page);
    await expect(app.sceneTitle()).toHaveValue(scene1.title);
  });
});
