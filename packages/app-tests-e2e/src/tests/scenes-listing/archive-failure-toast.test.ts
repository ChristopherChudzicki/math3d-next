import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { makeUserIdentity } from "@/utils/api/auth";
import AppPage from "@/utils/pages/AppPage";

test.use({ user: makeUserIdentity() });

test("A failed archive toasts over My Scenes, and closing the toast leaves the drawer open", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  await prepareScene(scene.json());
  await page.route("**/v1/scenes/*/", (route) =>
    route.request().method() === "PATCH"
      ? route.fulfill({ status: 500, json: { detail: "boom" } })
      : route.continue(),
  );

  const myScenes = new AppPage(page).myScenes();
  await myScenes.goTo();
  await myScenes.assertReady();
  const drawer = page.getByRole("dialog", { name: "Scenes" });
  const toasts = page.getByRole("region", { name: "Notifications" });
  const message = `Couldn’t archive “${scene.title}”. Try again.`;
  const item = myScenes.sceneItem(scene.title);
  const archive = async () => {
    await item.menuTrigger().click();
    await item.menuItem.archive().click();
    await expect(toasts.getByText(message)).toBeVisible();
  };

  // F6 focuses the toast viewport: Escape there leaves the drawer open.
  await archive();
  await page.keyboard.press("F6");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeVisible();
  // Tab reaches the toast: Escape closes it, and only it.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await expect(toasts.getByText(message)).toHaveCount(0);
  await expect(drawer).toBeVisible();

  // Above the drawer's backdrop, Dismiss is clickable and leaves the drawer open.
  // Base UI hides it from assistive tech until hover or focus expands the toast.
  await archive();
  await toasts.getByText(message).hover();
  await toasts.getByRole("button", { name: "Dismiss" }).click();
  await expect(toasts.getByText(message)).toHaveCount(0);
  await expect(drawer).toBeVisible();
});
