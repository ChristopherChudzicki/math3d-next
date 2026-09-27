import type { Locator, Page } from "@playwright/test";

type ByRoleOptions = Parameters<Locator["getByRole"]>[1];

class UserMenu {
  root: Locator;

  page: Page;

  constructor(page: Page) {
    const root = page.getByRole("menu", { name: /^(User )?Menu$/ });
    this.root = root;
    this.page = page;
  }

  /** The menu trigger, whichever of the two the auth state renders. */
  opener(opts?: ByRoleOptions): Locator {
    return this.page.getByRole("button", {
      name: /^Open (User )?Menu$/,
      ...opts,
    });
  }

  /**
   * The signed-in trigger specifically. The hamburger is both the signed-out
   * trigger and what shows while the `["me"]` query is in flight, so waiting on
   * the avatar is how a test waits past an unsettled auth state.
   */
  avatarOpener(opts?: ByRoleOptions): Locator {
    return this.page.getByRole("button", { name: "Open User Menu", ...opts });
  }

  /** The signed-out trigger, which is also the pending one. */
  hamburgerOpener(opts?: ByRoleOptions): Locator {
    return this.page.getByRole("button", { name: "Open Menu", ...opts });
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
}

export default UserMenu;
