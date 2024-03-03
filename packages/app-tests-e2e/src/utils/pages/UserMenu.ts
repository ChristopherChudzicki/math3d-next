import type { Locator, Page } from "@playwright/test";

class UserMenu {
  root: Locator;

  page: Page;

  constructor(page: Page) {
    const root = page.getByRole("menu", { name: "User Menu" });
    this.root = root;
    this.page = page;
  }

  opener(): Locator {
    return this.page.getByRole("button", { name: "Open User Menu" });
  }

  username(): Locator {
    return this.root.getByTestId("username-display");
  }

  signOut(): Locator {
    return this.root.getByRole("menuitem", { name: "Sign out" });
  }

  myScenes(): Locator {
    return this.root.getByRole("menuitem", { name: "My Scenes" });
  }

  examples(): Locator {
    return this.root.getByRole("menuitem", { name: "Examples" });
  }

  contact(): Locator {
    return this.root.getByRole("menuitem", { name: "Contact" });
  }

  items(): Locator {
    return this.root.getByRole("menuitem");
  }
}

export default UserMenu;
