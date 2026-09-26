import type { Locator, Page } from "@playwright/test";

/**
 * The sign-in dialog. Tests use the dev button: it posts the same redirect form
 * as Google's, with `provider=dummy`, so the round trip is the app's real one.
 */
class LoginDialog {
  root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("dialog", { name: "Sign in" });
  }

  devSignIn(): Locator {
    return this.root.getByRole("button", { name: "Sign in as dev user" });
  }
}

export default LoginDialog;
