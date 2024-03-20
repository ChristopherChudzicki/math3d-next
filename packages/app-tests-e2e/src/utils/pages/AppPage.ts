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

  async assertSignedOut() {
    await expect(this.userMenu().opener()).toHaveText("");
    await this.userMenu().opener().click();
    await expect(this.userMenu().username()).not.toBeVisible();
  }
}

export default AppPage;
