import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { makeSignInIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

// Created up front so the fixture owns its cleanup: signing up through the UI
// would leave an account behind.
const signInUser = makeSignInIdentity();

test("Signing in leaves unsaved edits to the open scene intact", async ({
  page,
  getPrepareScene,
  createUser,
}) => {
  const initialDescription = faker.lorem.words(3);
  const editedDescription = faker.lorem.words(3);

  await createUser(signInUser);

  const scene = new SceneBuilder();
  scene.folder().point({ description: initialDescription });
  const key = await getPrepareScene({ sessionCookies: null })(scene);

  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({
    description: initialDescription,
  });
  await item.field("description").fill(editedDescription);

  await test.step("Sign in from the editor", async () => {
    await app.userMenu().opener().click();
    await app.userMenu().signin().click();
    await app.loginDialog().devEmail().fill(signInUser.email);
    await app.loginDialog().devSubmit().click();

    await app.userMenu().avatarOpener().click();
    await expect(app.userMenu().username()).toHaveText(signInUser.email);
    await app.userMenu().root.press("Escape");
  });

  // Sign-in must not refetch the scene: a refetch hands `useSceneLoader` a new
  // object identity, which replaces Redux wholesale and drops the edit.
  await expect(item.field("description")).toHaveValue(editedDescription);
});
