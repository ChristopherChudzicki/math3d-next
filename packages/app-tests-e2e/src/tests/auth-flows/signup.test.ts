import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import { getEmailBackend } from "@/utils/inbox/emails";
import env from "@/env";
import invariant from "tiny-invariant";
import { faker } from "@faker-js/faker/locale/en";

// create - activate - signin - verify - signout - verify
// create - duplicate account - error
// reset - unactivated acount
// reset - activated account
// reset - bad token

test("User sign up flow", async ({ page, context }) => {
  const inbox = getEmailBackend();

  await test.step("Create account", async () => {
    await page.goto("/");
    const app = new AppPage(page);
    await app.signupPage().signup({
      email: env.TEST_USER_3_EMAIL,
      publicNickname: "Test user 3",
      password: env.TEST_USER_3_PASSWORD,
    });
    const successScreen = app.signupPage().successScreen();
    await expect(successScreen).toBeVisible();

    await expect(successScreen.getByRole("alert")).toContainText(
      `To finish creating your account, please use the link emailed to ${env.TEST_USER_3_EMAIL}`,
    );
  });

  const authedPage = await test.step("Activate account", async () => {
    const message = await inbox.waitForEmail({
      subject: "Activate your account",
      to: env.TEST_USER_3_EMAIL,
    });
    invariant(message.html, "Expected email to have HTML content");
    const messagePage = await context.newPage();
    await messagePage.setContent(message.html);
    const link = await messagePage.getByTestId("activation-link");
    await link.click();
    return messagePage;
  });

  await test.step("Verify account is activated", async () => {
    const dialog = await authedPage.getByRole("dialog", {
      name: "Account Activation",
    });
    await expect(await dialog.getByRole("alert")).toContainText(
      /Account successfully activated./,
    );
    return dialog.getByRole("link", { name: "log in" }).click();
  });

  await test.step("Sign in & verify", async () => {
    const app = new AppPage(authedPage);
    await app.signinPage().signin({
      email: env.TEST_USER_3_EMAIL,
      password: env.TEST_USER_3_PASSWORD,
    });
    await app.userMenu().opener().click();
    await expect(app.userMenu().username()).toHaveText(env.TEST_USER_3_EMAIL);
  });
});

test.only("Existing accounts cause error on signup", async ({ page }) => {
  await page.goto("/");
  const app = new AppPage(page);
  await app.signupPage().signup({
    email: env.TEST_USER_1_EMAIL,
    publicNickname: faker.name.firstName(),
    password: faker.internet.password(),
  });
  await expect(app.signupPage().email()).toBeInvalid();
  await expect(app.signupPage().email()).toHaveDescription(
    "User with this email address already exists.",
  );
});
