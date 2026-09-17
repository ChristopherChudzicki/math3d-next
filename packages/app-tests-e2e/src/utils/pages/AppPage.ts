import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import UserMenu from "./UserMenu";
import SignoutPage from "./SignoutPage";
import LoginDialog from "./LoginDialog";
import DeleteAccountPage from "./DeleteAccountPage";
import ItemSettings, { UniqueItemSettingsOpts } from "./ItemSettings";
import SharePopover from "./SharePopover";
import MyScenes from "./MyScenes";

class AppPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  userMenu(): UserMenu {
    return new UserMenu(this.page);
  }

  signoutPage(): SignoutPage {
    return new SignoutPage(this.page);
  }

  loginDialog(): LoginDialog {
    return new LoginDialog(this.page);
  }

  sharePopover(): SharePopover {
    return new SharePopover(this.page);
  }

  sceneTitle(): Locator {
    return this.header().getByLabel("Scene title");
  }

  header(): Locator {
    return this.page.getByRole("banner");
  }

  saveButton(): Locator {
    const header = this.header();
    return header.getByRole("button").and(header.getByTestId("save"));
  }

  deleteAccountPage(): DeleteAccountPage {
    return new DeleteAccountPage(this.page);
  }

  myScenes(): MyScenes {
    return new MyScenes(this.page);
  }

  async assertSignedOut() {
    await this.userMenu().opener().click();
    // Assert on "Sign in" as well as the username's absence: a menu that has
    // not rendered satisfies the absence check on its own.
    await expect(this.userMenu().signin()).toBeVisible();
    await expect(this.userMenu().username()).not.toBeVisible();
    await this.userMenu().root.press("Escape");
  }

  getUniqueItemSettings(opts: UniqueItemSettingsOpts): Promise<ItemSettings> {
    return ItemSettings.getUniqueItemSettings(this.page, opts);
  }
}

export default AppPage;
