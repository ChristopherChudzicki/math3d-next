import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";
import { makeUserInfo } from "@math3d/mock-api";

test.describe("User settings profile form", () => {
  const user = makeUserInfo();
  test.use({ user });

  test("Editing user profile", async ({ page }) => {
    const app = new AppPage(page);
    await page.goto("");
    await app.userMenu().activate("settings");

    const newNickname = faker.person.firstName();
    await test.step("Fill out form", async () => {
      const profileForm = app.userSettings().profileForm();
      await expect(profileForm.email()).toHaveValue(user.email);
      await profileForm.publicNickname().fill(newNickname);
      await profileForm.submit().click();
    });

    await test.step("Check updated nickname", async () => {
      // Reload so the form re-reads from the API: the nickname is no longer
      // rendered anywhere else (the avatar is always a generic icon).
      await page.reload();
      await expect(
        app.userSettings().profileForm().publicNickname(),
      ).toHaveValue(newNickname);
    });
  });

  test("Editing profile form validation", async ({ page }) => {
    const app = new AppPage(page);
    await page.goto("");
    await app.userMenu().activate("settings");

    const form = app.userSettings().profileForm();
    await expect(form.email()).toBeDisabled();
    await form.publicNickname().fill("");
    await form.submit().click();
    await expect(form.publicNickname()).toBeInvalid();
    await expect(form.publicNickname()).toHaveDescription(
      "Public nickname is a required field",
    );
  });
});
