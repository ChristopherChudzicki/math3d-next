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

class ChangePasswordForm {
  private root: Locator;

  constructor(root: Locator) {
    this.root = root;
  }

  activate(): Promise<void> {
    return this.root.getByRole("tab", { name: "Change Password" }).click();
  }

  currentPassword(): Locator {
    return this.root.getByLabel("Current Password", { exact: true });
  }

  newPassword(): Locator {
    return this.root.getByLabel("New Password", { exact: true });
  }

  confirmNewPassword(): Locator {
    return this.root.getByLabel("Confirm New Password");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Save" });
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

  changePasswordForm(): ChangePasswordForm {
    return new ChangePasswordForm(this.root);
  }

  cancel(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }

  close(): Locator {
    return this.root.getByRole("button", { name: "Close" });
  }
}

export default UserSettingsPage;
