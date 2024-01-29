import type { Locator } from "@playwright/test";

class UserMenu {
  root: Locator;

  constructor(locator: Locator) {
    this.root = locator;
  }

  username(): Locator {
    return this.root.getByTestId("username-display");
  }

  signOut(): Locator {
    return this.root.getByRole("button", { name: "Sign out" });
  }

  myScenes(): Locator {
    return this.root.getByRole("button", { name: "My Scenes" });
  }

  examples(): Locator {
    return this.root.getByRole("button", { name: "Examples" });
  }

  contact(): Locator {
    return this.root.getByRole("button", { name: "Contact" });
  }

  items(): Locator {
    return this.root.getByRole("menuitem");
  }
}

export default UserMenu;
