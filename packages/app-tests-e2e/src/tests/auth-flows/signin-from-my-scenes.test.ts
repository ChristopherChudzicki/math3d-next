import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";

// Created up front so the fixture owns its cleanup: signing up through the UI
// would leave an account behind.
const signInUser = makeUserIdentity();

test("Signing in from My Scenes returns to My Scenes", async ({
  page,
  createUser,
}) => {
  await createUser(signInUser);
  const app = new AppPage(page);

  await app.myScenes().goTo();
  const myScenes = page.getByRole("tabpanel", { name: "My Scenes" });
  await myScenes.getByRole("button", { name: "Sign in" }).click();
  await app.loginDialog().devSignIn().click();
  await app.dummyProvider().signIn(signInUser);

  await expect(page).toHaveURL(/\/\?overlay=scenes&list=me$/);
  await expect(
    page.getByRole("tab", { name: "My Scenes", selected: true }),
  ).toBeVisible();
  await expect(myScenes.getByRole("button", { name: "Sign in" })).toBeHidden();
});
