import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { expectThreeViewport } from "@/utils/threeViewport";
import {
  blueFirstOverRed,
  expectRedToHideBlue,
  narrowWindow,
  redOverBlue,
  sharesOnce,
} from "@/utils/threeTransparency";

test.use({ disable3d: false });

const canvas = (page: Page) => page.getByTestId("scene").locator("canvas");

test("three.js on WebGL2 draws in MathBox's order by default: zOrder decides what a translucent item hides", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-backend", "webgl2");
  await expect(canvas(page)).toHaveAttribute("data-transparency", "ordered");
  const { blueOverRed } = await sharesOnce(page, "blueOverWhite");
  expect(blueOverRed).toBeLessThan(0.001);
  expect(errors).toEqual([]);
});

test("three.js order-independent transparency on WebGL2 blends whatever the zOrder", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0&oit=1`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-transparency", "oit");
  await sharesOnce(page, "blueOverRed");
  expect(errors).toEqual([]);
});

test("three.js order-independent transparency on WebGL2 tests depth, also after a resize", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(redOverBlue().json());
  await page.goto(`/${key}?renderer=threejs&controls=0&oit=1`);

  await expectThreeViewport(page);
  await expectRedToHideBlue(page);
  await narrowWindow(page);
  await expectRedToHideBlue(page);
  expect(errors).toEqual([]);
});
