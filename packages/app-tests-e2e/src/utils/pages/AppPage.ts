import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import UserMenu from "./UserMenu";
import SigninPage from "./SigninPage";
import SignupPage from "./SignupPage";
import SignoutPage from "./SignoutPage";
import UserSettingsPage from "./UserSettingsPage";

class AppPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  userMenu(): UserMenu {
    return new UserMenu(this.page);
  }

  signupPage(): SignupPage {
    return new SignupPage(this.page);
  }

  signinPage(): SigninPage {
    return new SigninPage(this.page);
  }

  signoutPage(): SignoutPage {
    return new SignoutPage(this.page);
  }

  header(): Locator {
    return this.page.getByRole("banner");
  }

  userSettings(): UserSettingsPage {
    return new UserSettingsPage(this.page);
  }

  async signin({
    password,
    email,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    await this.userMenu().opener().click();
    await this.userMenu().signin().click();
    await this.signinPage().signin({ password, email });
  }

  async signout(): Promise<void> {
    await this.userMenu().opener().click();
    await this.userMenu().signout().click();
    await this.signoutPage().confirm().click();
  }

  async assertSignedOut() {
    await expect(this.userMenu().opener()).toHaveText("");
    await this.userMenu().opener().click();
    await expect(this.userMenu().username()).not.toBeVisible();
    await this.userMenu().root.press("Escape");
  }

  async assertSignedIn() {
    await this.userMenu().opener().click();
    await expect(this.userMenu().username()).toBeVisible();
    await this.userMenu().root.press("Escape");
  }
}

export default AppPage;
