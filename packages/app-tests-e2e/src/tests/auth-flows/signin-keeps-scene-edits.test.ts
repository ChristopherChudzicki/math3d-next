import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { dummyIdentity } from "@math3d/api";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

// The account the dev control will sign into. Created up front so the fixture
// owns its cleanup: signing up through the UI would leave an account behind.
// The uid has to be the one the app derives from the address, or allauth sees
// an unknown identity claiming a taken address and refuses it (401).
const signInUser = dummyIdentity(makeUserIdentity().email);

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

    await app.userMenu().opener().click();
    await expect(app.userMenu().username()).toHaveText(signInUser.email);
    await app.userMenu().root.press("Escape");
  });

  // Sign-in must not refetch the scene: a refetch hands `useSceneLoader` a new
  // object identity, which replaces Redux wholesale and drops the edit.
  await expect(item.field("description")).toHaveValue(editedDescription);
});
