import type { Locator, Page } from "@playwright/test";

type ByRoleOptions = Parameters<Locator["getByRole"]>[1];

type UserMenuOption =
  | "signin"
  | "signup"
  | "signout"
  | "myScenes"
  | "examples"
  | "settings"
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

  signup(): Locator {
    return this.root.getByRole("menuitem", { name: "Sign up" });
  }

  myScenes(): Locator {
    return this.root.getByRole("menuitem", { name: "My Scenes" });
  }

  examples(): Locator {
    return this.root.getByRole("menuitem", { name: "Examples" });
  }

  settings(): Locator {
    return this.root.getByRole("menuitem", { name: "Account Settings" });
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
