import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

test.describe("Authorized user (dynamic)", () => {
  test.use({ user: "worker" });

  test("Building a custom scene", async ({ page, prepareScene }) => {
    const scene = new SceneBuilder();
    scene //
      .folder({ description: "Folder 1" })
      .point({ color: "orange", coords: "[1, 2, 3]" }, "F1_point");
    const key = await prepareScene(scene);
    await page.goto(`/${key}`);
    const app = new AppPage(page);

    const item = await app.getUniqueItemSettings({ id: "F1_point" });
    await expect(item.root).toBeVisible();
  });
});
