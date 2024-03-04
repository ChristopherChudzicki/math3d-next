import type { Locator, Page } from "@playwright/test";

class SignoutPage {
  private page: Page;

  private root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog", { name: "Sign out" });
  }

  confirm(): Locator {
    return this.root.getByRole("button", { name: "Yes, sign out" });
  }

  cancel(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }
}

export default SignoutPage;
