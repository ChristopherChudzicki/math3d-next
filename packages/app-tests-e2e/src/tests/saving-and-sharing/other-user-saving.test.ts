import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { getAuthToken } from "@/utils/api/auth";

const user = makeUserInfo();
test.use({ user });
const sceneOwner = makeUserInfo();

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
    const owner = await createUser(sceneOwner);
    const ownerAuthToken = await getAuthToken(owner);
    const prepareScene = getPrepareScene({ authToken: ownerAuthToken });
    const scene = new SceneBuilder({ title });
    scene //
      .folder({ description: "Folder 1" })
      .point({ description: initialDescription });

    return prepareScene(scene);
  });

  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings(initialDescription);

  await test.step("'Save a Copy' is initially enabled", async () => {
    await expect(app.saveButton()).toBeEnabled();
    await expect(app.saveButton()).toHaveAccessibleName("Save a Copy");
  });

  await test.step("Save scene", async () => {
    // assert initial URL for sanity
    expect(new URL(page.url()).pathname).toBe(`/${key}`);

    await item.field("description").fill(newDescription);
    await app.saveButton().click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Saved!" }),
    ).toBeVisible();
    await expect(item.root).toBeVisible();

    // assert initial URL for sanity
    const newUrl = new URL(page.url());
    expect(newUrl.pathname).not.toBe(`/${key}`);
    return newUrl.pathname;
  });

  await test.step("Assert ownership and change", async () => {
    await page.reload();
    // button shows 'Save' now that we are owner
    await expect(app.saveButton()).toHaveText("Save");
    // item has new description
    await expect(item.field("description")).toHaveValue(newDescription);
    // original title unchanged... we didn't touch it
    await expect(app.sceneTitle()).toHaveValue(title);
  });

  await test.step("Assert original page unchanged", async () => {
    await page.goto(`/${key}`);
    // Original still shows 'Save a copy
    await expect(app.saveButton()).toHaveText("Save a Copy");
    // item has new description
    await expect(item.field("description")).toHaveValue(initialDescription);
  });
});
