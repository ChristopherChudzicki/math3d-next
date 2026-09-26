import type { Locator, Page } from "@playwright/test";
import type { UserIdentity } from "@/utils/api/auth";

/** allauth's dummy provider form, served by the API at dummy/authenticate/. */
class DummyProviderPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Django's `as_p` suffixes each label with ":"; exact matching keeps
  // "Email:" from also matching "Email verified:".
  private field(label: string): Locator {
    return this.page.getByLabel(`${label}:`, { exact: true });
  }

  async signIn(identity: UserIdentity): Promise<void> {
    await this.field("Account ID").fill(identity.uid);
    await this.field("Email").fill(identity.email);
    await this.field("Email verified").check();
    await this.page.getByRole("button", { name: "Login" }).click();
  }

  async cancel(): Promise<void> {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }
}

export default DummyProviderPage;
