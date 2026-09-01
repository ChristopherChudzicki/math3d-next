import type { Locator, Page } from "@playwright/test";

class DeleteAccountForm {
  private root: Locator;

  constructor(root: Locator) {
    this.root = root;
  }

  confirm(): Locator {
    return this.root.getByLabel("Confirm");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Delete Account" });
  }
}

class UserSettingsPage {
  private root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("dialog", { name: "Account Settings" });
  }

  deleteAccountForm(): DeleteAccountForm {
    return new DeleteAccountForm(this.root);
  }

  cancel(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }

  close(): Locator {
    return this.root.getByRole("button", { name: "Close" });
  }
}

export default UserSettingsPage;
