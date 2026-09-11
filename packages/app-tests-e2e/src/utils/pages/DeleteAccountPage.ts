import type { Locator, Page } from "@playwright/test";

class DeleteAccountPage {
  private root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("dialog", { name: "Delete Account" });
  }

  confirm(): Locator {
    return this.root.getByLabel("Confirm");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Delete Account" });
  }
}

export default DeleteAccountPage;
