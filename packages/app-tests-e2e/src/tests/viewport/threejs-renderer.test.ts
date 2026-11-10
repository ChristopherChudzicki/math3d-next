import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import UserMenu from "@/utils/pages/UserMenu";

test.use({ disable3d: false });

const expectThreeViewport = async (page: Page) => {
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport.locator("[data-ready]")).toBeAttached({
    timeout: 15_000,
  });
};

test("?renderer=threejs draws with the three.js viewport", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}?renderer=threejs`);

  await expectThreeViewport(page);
  await expect(
    page.getByRole("button", { name: "three.js renderer" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("choosing three.js in the menu draws with it", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}`);
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-renderer",
    "mathbox",
  );

  const menu = new UserMenu(page);
  await menu.opener().click();
  await menu.renderer("three.js (experimental)").click();

  await expectThreeViewport(page);
  await menu.opener().click();
  await expect(menu.renderer("three.js (experimental)")).toBeChecked();
  expect(errors).toEqual([]);
});
