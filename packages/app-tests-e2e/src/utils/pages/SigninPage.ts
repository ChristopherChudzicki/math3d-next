import type { Locator, Page } from "@playwright/test";

class SigninPage {
  private page: Page;

  private root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("dialog", { name: "Sign in" });
  }

  email(): Locator {
    return this.root.getByLabel("Email");
  }

  password(): Locator {
    return this.root.getByLabel("Password");
  }

  submit(): Locator {
    return this.root.getByRole("button", { name: "Sign in" });
  }

  cancel(): Locator {
    return this.root.getByRole("button", { name: "Cancel" });
  }

  async signin({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<void> {
    if (!this.page.url().includes("auth/login")) {
      this.page.getByRole("link", { name: "Sign in" }).click();
    }
    await this.email().fill(email);
    await this.password().fill(password);
    await this.submit().click();
  }
}

export default SigninPage;
