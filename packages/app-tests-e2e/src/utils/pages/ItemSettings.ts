import { expect, type Locator, type Page } from "@playwright/test";
import invariant from "tiny-invariant";

type FieldName = "description" | string;

type UniqueItemSettingsOpts = {
  description?: string;
  id?: string;
};

class MoreSettings {
  root: Locator;

  itemRoot: Locator;

  page: Page;

  constructor(itemRoot: Locator, page: Page) {
    this.root = page.getByTestId("more-settings-form");
    this.itemRoot = itemRoot;
    this.page = page;
  }

  opener(): Locator {
    return this.itemRoot.getByRole("button", { name: "More settings" });
  }
}

class ItemSettings {
  root: Locator;

  page: Page;

  constructor(page: Page, testId: string) {
    const root = page.getByTestId(testId);
    this.root = root;
    this.page = page;
  }

  static async getUniqueItemSettings(
    page: Page,
    { id, description }: UniqueItemSettingsOpts,
  ): Promise<ItemSettings> {
    invariant(description || id, "Either description or id must be provided");
    const form = id
      ? page.getByTestId(`settings-${id}`)
      : page.getByRole("form", {
          name: `Settings for ${description}`,
        });
    await expect(form).toHaveCount(1);
    const testId = await form.evaluate((el) => el.dataset.testid);
    invariant(testId);
    return new ItemSettings(page, testId);
  }

  field(name: FieldName): Locator {
    return this.root.getByLabel(name);
  }

  moreSettings(): MoreSettings {
    return new MoreSettings(this.root, this.page);
  }
}

export default ItemSettings;
export type { UniqueItemSettingsOpts };
