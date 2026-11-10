import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import invariant from "tiny-invariant";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import UserMenu from "@/utils/pages/UserMenu";
import { getItemForm, getLatex } from "@/utils/selectors";

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

test("a drag in the three.js viewport writes the camera back", async ({
  page,
  prepareScene,
}) => {
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}?renderer=threejs`);
  await expectThreeViewport(page);
  await page.getByRole("tab", { name: "Setup" }).click();
  const position = getItemForm(page, { id: "camera" }).getByLabel("Position");
  const before = await position.evaluate(getLatex);

  const canvas = page.getByTestId("scene").locator("canvas");
  const box = await canvas.boundingBox();
  invariant(box);
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 100, y + 40, { steps: 10 });
  await page.mouse.up();

  await expect.poll(() => position.evaluate(getLatex)).not.toBe(before);
});
