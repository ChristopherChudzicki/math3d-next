import type { Locator, Page } from "@playwright/test";
import UserMenu from "./UserMenu";
import SigninPage from "./SigninPage";
import SignupPage from "./SignupPage";
import SignoutPage from "./SignoutPage";

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
}

export default AppPage;
