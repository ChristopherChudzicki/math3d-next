import type { Locator, Page } from "@playwright/test";

/**
 * The sign-in dialog.
 *
 * Only the dev control is reachable from a test: the Google button is drawn by
 * Google's own script and its credential comes from a consent popup. The dev
 * control sends the same mutation with different arguments, so driving it
 * exercises the app's real sign-in path.
 */
class LoginDialog {
  root: Locator;

  constructor(page: Page) {
    this.root = page.getByRole("dialog", { name: "Sign in" });
  }

  devEmail(): Locator {
    return this.root.getByLabel("Dev sign-in email");
  }

  devSubmit(): Locator {
    return this.root.getByRole("button", { name: "Sign in as dev user" });
  }
}

export default LoginDialog;
