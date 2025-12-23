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
      // Only the initial is displayed in user menu
      await expect(app.userMenu().opener({ includeHidden: true })).toHaveText(
        newNickname[0],
      );
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
