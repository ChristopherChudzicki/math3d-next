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

test("three.js with ?oit=0 draws in MathBox's order: zOrder decides what a translucent item hides", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0&oit=0`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-transparency", "ordered");
  const { red, blueOverRed } = await sharesOnce(page, "blueOverWhite");
  // The red plane is drawn: it shows where it sticks out from under the blue.
  expect(red).toBeGreaterThan(0.01);
  expect(blueOverRed).toBeLessThan(0.001);
  expect(errors).toEqual([]);
});

test("three.js order-independent transparency on WebGL2 blends whatever the zOrder", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-backend", "webgl2");
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
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await expectRedToHideBlue(page);
  await narrowWindow(page);
  await expectRedToHideBlue(page);
  expect(errors).toEqual([]);
});

test("three.js on WebGL2 without per-attachment blending draws in MathBox's order", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  await page.addInitScript(() => {
    const { getExtension } = WebGL2RenderingContext.prototype;
    WebGL2RenderingContext.prototype.getExtension = function withoutIndexed(
      this: WebGL2RenderingContext,
      name: string,
    ) {
      return name === "OES_draw_buffers_indexed"
        ? null
        : Reflect.apply(getExtension, this, [name]);
    };
  });
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-transparency", "ordered");
  // The translucent plane is drawn, which the OIT pass couldn't do here.
  await sharesOnce(page, "blueOverWhite");
  expect(errors).toEqual([]);
});
