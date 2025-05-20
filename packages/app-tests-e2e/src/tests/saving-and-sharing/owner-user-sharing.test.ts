import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";

const user = makeUserInfo();
test.use({ user });

test("Sharing before save...just like anon users", () => {});

[
  { preexisting: false, itemDescription: "Explicit Surface" },
  { preexisting: true, itemDescription: "Point" },
].forEach(({ preexisting, itemDescription }) => {
  test(`Sharing previously saved scene (preexisting: ${preexisting})`, async ({
    page,
    prepareScene,
  }) => {
    if (preexisting) {
      const scene = new SceneBuilder();
      scene.folder().point({ description: itemDescription });
      const sceneId = await prepareScene(scene.json());
      await page.goto(`/${sceneId}`);
    } else {
      await page.goto("");
    }
    const app = new AppPage(page);
    const url = page.url();

    await test.step("Share without editing... no warning", async () => {
      const shareButton = app.sharePopover().trigger();
      await shareButton.click();
      await expect(app.sharePopover().shareableUrl()).toHaveValue(url);
      await expect(app.sharePopover().region()).toBeVisible();
      await expect(
        app.sharePopover().region().getByRole("alert"),
      ).not.toBeVisible();
      await app.sharePopover().close();
    });

    await test.step("Share with edit...warn unsaved changes", async () => {
      const description = faker.lorem.words();
      const item = await app.getUniqueItemSettings({
        description: itemDescription,
      });
      await item.field("description").fill(description);

      const shareButton = app.sharePopover().trigger();
      await shareButton.click();
      await expect(app.sharePopover().shareableUrl()).toHaveValue(url);
      await expect(app.sharePopover().region()).toBeVisible();
      await expect(
        app.sharePopover().region().getByRole("alert"),
      ).toBeVisible();
    });
  });
});
