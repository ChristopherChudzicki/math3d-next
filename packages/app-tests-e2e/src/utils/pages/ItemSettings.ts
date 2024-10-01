import { expect, type Locator, type Page } from "@playwright/test";
import invariant from "tiny-invariant";

type FieldName = "description";

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
    description: string,
  ): Promise<ItemSettings> {
    const form = page.getByRole("form", {
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
}

export default ItemSettings;
