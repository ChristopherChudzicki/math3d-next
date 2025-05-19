import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserInfo();
test.use({ user });

test("Settings details toggle", async ({ page, prepareScene }) => {
  const scene = new SceneBuilder();
  scene //
    .folder({ description: "Folder 1" })
    .point({ color: "orange", coords: "[1, 2, 3]" }, "F1_point");

  const key = await prepareScene(scene);
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  // Locate item
  const item = await app.getUniqueItemSettings({ id: "F1_point" });
  await expect(item.root).toBeVisible();

  // Locate More Settings
  const moreSettings = item.moreSettings();
  await moreSettings.opener().click();
  await expect(moreSettings.root).toBeVisible();

  // Locate zBias
  const zBias = moreSettings.root.getByLabel("Z-Bias", { exact: true });
  await expect(zBias).toBeVisible();
  const descriptionToggle = moreSettings.root.getByRole("button", {
    name: "Show Z-Bias Description",
  });

  await expect(descriptionToggle).toBeVisible();
  await expect(descriptionToggle).toHaveAttribute("aria-pressed", "false");
  await expect(zBias).not.toHaveAttribute("aria-describedby");
  await descriptionToggle.click();

  await expect(descriptionToggle).toHaveAttribute("aria-pressed", "true");
  await expect(zBias).toHaveAttribute("aria-describedby");
  await expect(zBias).toHaveAccessibleDescription(/Offset the object/);
});
