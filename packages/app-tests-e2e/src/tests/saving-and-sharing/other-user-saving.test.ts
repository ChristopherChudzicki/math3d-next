import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test.use({ user: "worker" });
const sceneOwner = makeUserIdentity();

test.setTimeout(60_000);

test("Saving an existing scene scene", async ({
  page,
  getPrepareScene,
  createUser,
}) => {
  const initialDescription = faker.lorem.words(3);
  const newDescription = faker.lorem.words(3);
  const title = faker.lorem.words(3);

  const key = await test.step("Prepare scene as user 'owner'", async () => {
    const { cookies: ownerCookies } = await createUser(sceneOwner);
    const prepareScene = getPrepareScene({ sessionCookies: ownerCookies });
    const scene = new SceneBuilder({ title });
    scene //
      .folder({ description: "Folder 1" })
      .point({ description: initialDescription });

    return prepareScene(scene);
  });

  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({
    description: initialDescription,
  });

  await test.step("'Save a copy' is initially enabled", async () => {
    await expect(app.sceneAction()).toBeEnabled();
    await expect(app.sceneAction()).toHaveAccessibleName("Save a copy");
  });

  await test.step("Save scene", async () => {
    // assert initial URL for sanity
    expect(new URL(page.url()).pathname).toBe(`/${key}`);

    await item.field("description").fill(newDescription);
    await app.sceneAction().click();
    await page
      .getByRole("dialog", { name: "Scene saved!" })
      .getByRole("button", { name: "Done" })
      .click();
    await expect(item.root).toBeVisible();

    const newUrl = new URL(page.url());
    expect(newUrl.pathname).not.toBe(`/${key}`);
    return newUrl.pathname;
  });

  await test.step("Assert ownership and change", async () => {
    await page.reload();
    // Owned and unedited, so the primary action copies the link
    await expect(app.sceneAction()).toHaveAccessibleName("Copy link");
    // item has new description
    await expect(item.field("description")).toHaveValue(newDescription);
    // a copy of a titled scene is titled "Copy of …"
    await expect(app.sceneTitle()).toHaveText(`Copy of ${title}`);
  });

  await test.step("Assert original page unchanged", async () => {
    await page.goto(`/${key}`);
    // Original still shows 'Save a copy'
    await expect(app.sceneAction()).toHaveAccessibleName("Save a copy");
    // item has new description
    await expect(item.field("description")).toHaveValue(initialDescription);
  });
});
