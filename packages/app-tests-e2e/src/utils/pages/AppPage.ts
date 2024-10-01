import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import UserMenu from "./UserMenu";
import SigninPage from "./SigninPage";
import SignupPage from "./SignupPage";
import SignoutPage from "./SignoutPage";
import UserSettingsPage from "./UserSettingsPage";
import ItemSettings from "./ItemSettings";
import SharePopover from "./SharePopover";

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

  sharePopover(): SharePopover {
    return new SharePopover(this.page);
  }

  sceneTitle(): Locator {
    return this.header().getByLabel("Scene title");
  }

  header(): Locator {
    return this.page.getByRole("banner");
  }

  saveButton(): Locator {
    const header = this.header();
    return header.getByRole("button").and(header.getByTestId("save"));
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

  getUniqueItemSettings(description: string): Promise<ItemSettings> {
    return ItemSettings.getUniqueItemSettings(this.page, description);
  }
}

export default AppPage;
