import type { Locator, Page } from "@playwright/test";

class SigninPage {
  private page: Page;

  private root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog", { name: "Create Account" });
  }

  email(): Locator {
    return this.root.getByLabel("Email");
  }

  publicNickname(): Locator {
    return this.root.getByLabel("Public Nickname");
  }

  password(): Locator {
    return this.root.getByLabel("Password", { exact: true });
  }

  confirmPassword(): Locator {
    return this.root.getByLabel("Confirm Password");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Create Account" });
  }

  cancel(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }

  async signup({
    email,
    password,
    confirmPassword,
    publicNickname,
  }: {
    email: string;
    publicNickname: string;
    password: string;
    confirmPassword?: string;
  }): Promise<void> {
    if (!this.page.url().includes("auth/register")) {
      this.page.getByRole("link", { name: "Sign up" }).click();
    }
    await this.email().fill(email);
    await this.publicNickname().fill(publicNickname);
    await this.password().fill(password);
    await this.confirmPassword().fill(confirmPassword ?? password);
    await this.submit().click();
  }

  successScreen(): Locator {
    return this.page.getByRole("dialog", { name: "Confirmation Required" });
  }
}

export default SigninPage;
