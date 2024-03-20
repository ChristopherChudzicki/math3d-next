import type { Locator, Page } from "@playwright/test";

class ProfileForm {
  private root: Locator;

  constructor(root: Locator) {
    this.root = root;
  }

  activate(): Promise<void> {
    return this.root.getByRole("tab", { name: "Profile" }).click();
  }

  email(): Locator {
    return this.root.getByLabel("Email");
  }

  publicNickname(): Locator {
    return this.root.getByLabel("Public Nickname");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Save" });
  }
}

class DeleteAccountForm {
  private root: Locator;

  constructor(root: Locator) {
    this.root = root;
  }

  activate(): Promise<void> {
    return this.root.getByRole("tab", { name: "Delete Account" }).click();
  }

  password(): Locator {
    return this.root.getByLabel("Password", { exact: true });
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

  profileForm(): ProfileForm {
    return new ProfileForm(this.root);
  }

  deleteAccountForm(): DeleteAccountForm {
    return new DeleteAccountForm(this.root);
  }

  close(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }
}

export default UserSettingsPage;
