import type { Locator, Page } from "@playwright/test";

class SharePopover {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  trigger(): Locator {
    return this.page.getByRole("button", { name: "Share" });
  }

  region(): Locator {
    return this.page.getByRole("region", { name: "Share scene" });
  }

  shareableUrl(): Locator {
    return this.region().getByLabel("Shareable URL");
  }

  close(): Promise<void> {
    return this.page.keyboard.press("Escape");
  }
}

export default SharePopover;
