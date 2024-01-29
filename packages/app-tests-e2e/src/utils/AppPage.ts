import type { Locator, Page } from "@playwright/test";
import UserMenu from "./UserMenu";

class AppPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  userMenuOpener(): Locator {
    return this.page.getByRole("button", { name: "Open User Menu" });
  }

  userMenu(): UserMenu {
    this.page.getByRole("menu", { name: "User Menu" });
    const root = this.page.getByRole("menu", { name: "User Menu" });
    return new UserMenu(root);
  }

  header(): Locator {
    return this.page.getByRole("banner");
  }
}

export default AppPage;
