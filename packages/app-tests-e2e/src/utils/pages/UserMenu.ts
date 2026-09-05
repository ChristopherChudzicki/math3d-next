import type { Locator, Page } from "@playwright/test";

type ByRoleOptions = Parameters<Locator["getByRole"]>[1];

type UserMenuOption =
  | "signin"
  | "signout"
  | "myScenes"
  | "examples"
  | "deleteAccount"
  | "contact";

class UserMenu {
  root: Locator;

  page: Page;

  constructor(page: Page) {
    const root = page.getByRole("menu", { name: "User Menu" });
    this.root = root;
    this.page = page;
  }

  opener(opts?: ByRoleOptions): Locator {
    return this.page.getByRole("button", { name: "Open User Menu", ...opts });
  }

  username(): Locator {
    return this.root.getByTestId("username-display");
  }

  signout(): Locator {
    return this.root.getByRole("menuitem", { name: "Sign out" });
  }

  signin(): Locator {
    return this.root.getByRole("menuitem", { name: "Sign in" });
  }

  myScenes(): Locator {
    return this.root.getByRole("menuitem", { name: "My Scenes" });
  }

  examples(): Locator {
    return this.root.getByRole("menuitem", { name: "Examples" });
  }

  deleteAccount(): Locator {
    return this.root.getByRole("menuitem", { name: "Delete Account" });
  }

  contact(): Locator {
    return this.root.getByRole("menuitem", { name: "Contact" });
  }

  items(): Locator {
    return this.root.getByRole("menuitem");
  }

  async activate(option: UserMenuOption): Promise<void> {
    if (!(await this[option]().isVisible())) {
      await this.opener().click();
    }
    await this[option]().click();
  }
}

export default UserMenu;
