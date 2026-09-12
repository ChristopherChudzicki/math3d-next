import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test.use({ user: "worker" });

test("Editing while a save is in flight keeps the newer edit", async ({
  page,
  getPrepareScene,
  sessionCookies,
}) => {
  const description = faker.lorem.words(3);
  const scene = new SceneBuilder();
  scene.folder().point({ description });
  const key = await getPrepareScene({ sessionCookies })(scene);

  await page.goto(`/${key}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({ description });
  await item.field("description").fill(`${description} saved`);

  // The scene's only GET so far was the page load, so the next one is the
  // refetch the save triggers — the response that used to overwrite the editor.
  // Assert after it lands, or the assertion passes in the window before it.
  const refetched = page.waitForResponse(
    (r) =>
      r.request().method() === "GET" &&
      r.url().includes(`/v1/scenes/${key}/`) &&
      r.status() === 200,
  );
  await app.saveButton().click();
  await item.field("description").fill(`${description} typed during save`);
  await refetched;

  // The save's response body carries the scene as of the PATCH, so applying it
  // would roll the editor back over anything typed since.
  await expect(item.field("description")).toHaveValue(
    `${description} typed during save`,
  );
});
