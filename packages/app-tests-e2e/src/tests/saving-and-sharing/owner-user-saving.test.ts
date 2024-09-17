/**
 *
 * auth user, owner:
 * 1. Save new scene:
 *  - save disbabled (no changes)
 *  - make a change
 *  - save enbaled
 *  - save via dialog
 *  - same url
 *  - reload, change persists
 * 2. Save existing scene:
 *    - Same as (1), but not via dialog
 */

import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

const user = makeUserInfo();
test.use({ user });

test("Saving a new scene", async ({ page }) => {
  await page.goto("");
  const app = new AppPage(page);

  test.step("Making a change enables saving", async () => {});

  test.step("Save scene", async () => {});

  test.step("Reload saved scene", async () => {});
});
