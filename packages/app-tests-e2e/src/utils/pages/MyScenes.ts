import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type FieldName = "Filter scenes" | "Include archived";

class MySceneItem {
  root: Locator;

  private page: Page;

  constructor(page: Page, title: string) {
    this.page = page;
    this.root = page
      .getByRole("tabpanel", { name: "My Scenes" })
      .getByRole("listitem")
      .filter({ hasText: title });
  }

  menuTrigger(): Locator {
    return this.root.getByRole("button", { name: "Edit" });
  }

  menuItem = {
    delete: () => {
      return this.page.getByRole("menuitem", { name: "Delete" });
    },
    archive: () => {
      return this.page.getByRole("menuitem", { name: "Archive" });
    },
    unarchive: () => {
      return this.page.getByRole("menuitem", { name: "Unarchive" });
    },
  };
}

class MyScenes {
  private page: Page;

  private root: Locator;

  constructor(page: Page) {
    this.page = page;
    this.root = page.getByRole("tabpanel", { name: "My Scenes" });
  }

  async assertReady(): Promise<void> {
    await expect(
      this.page.getByRole("tab", { name: "My Scenes", selected: true }),
    ).toBeVisible();
    await expect(this.root).toBeVisible();
    await expect(this.root.getByRole("listitem").first()).not.toBeEmpty();
  }

  field(name: FieldName): Locator {
    return this.root.getByLabel(name);
  }

  sceneItem(title: string): MySceneItem {
    return new MySceneItem(this.page, title);
  }

  async goTo(): Promise<void> {
    await this.page.goto("/scenes/me");
  }
}

export default MyScenes;
