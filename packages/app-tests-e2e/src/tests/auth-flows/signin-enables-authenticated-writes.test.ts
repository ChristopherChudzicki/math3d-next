import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

// Created up front so the fixture owns its cleanup: signing up through the UI
// would leave an account behind.
const signInUser = makeUserIdentity();

// Reaching Django's own cookies is the whole point, so keep out the variant of
// the `page` fixture that injects them.
test.use({ user: null });
test.setTimeout(60_000);

/**
 * Every authenticated *write* in the suite runs on a `csrftoken` the `page`
 * fixture injects at a domain of its own choosing, which cannot catch a real
 * `CSRF_COOKIE_DOMAIN` the app is unable to read. This one writes on the
 * cookies Django set during a sign-in through the UI.
 *
 * The write has to be to an *owned* scene. django-ninja enforces CSRF inside
 * `SessionAuth` rather than in middleware, so only endpoints taking
 * `auth=session_auth` are checked at all: `POST /v1/scenes/` takes `auth=None`,
 * since anonymous users save scenes too, which leaves `PATCH /v1/scenes/{key}/`.
 */
test("Saving an owned scene works on the cookies a real sign-in sets", async ({
  page,
  getPrepareScene,
  createUser,
}) => {
  const initialDescription = faker.lorem.words(3);
  const editedDescription = faker.lorem.words(3);

  const { cookies } = await createUser(signInUser);

  const scene = new SceneBuilder();
  scene.folder().point({ description: initialDescription });
  const key = await getPrepareScene({ sessionCookies: cookies })(scene);

  await page.goto(`/${key}`);
  const app = new AppPage(page);

  await test.step("Sign in from the editor", async () => {
    await app.userMenu().opener().click();
    await app.userMenu().signin().click();
    await app.loginDialog().devSignIn().click();
    await app.dummyProvider().signIn(signInUser);

    // Only the owner's button reads "Save"; a signed-in non-owner gets
    // "Save a Copy", which saves a new scene through the exempt POST.
    await expect(app.saveButton()).toHaveAccessibleName("Save");
  });

  const item = await app.getUniqueItemSettings({
    description: initialDescription,
  });
  await item.field("description").fill(editedDescription);

  // Assert on the response rather than the "Saved!" alert: a CSRF rejection
  // leaves the save pending forever, so the alert's absence reports the save
  // UI instead of the 403.
  const patched = page.waitForResponse(
    (response) =>
      response.request().method() === "PATCH" &&
      response.url().includes(`/v1/scenes/${key}/`),
  );
  await app.saveButton().click();
  expect((await patched).status()).toBe(200);
});
