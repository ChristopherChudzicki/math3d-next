import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { expectThreeViewport } from "@/utils/threeViewport";
import { expectRedToHideBlue, redOverBlue } from "@/utils/threeTransparency";

test.use({ disable3d: false });

const canvas = (page: Parameters<typeof expectThreeViewport>[0]) =>
  page.getByTestId("scene").locator("canvas");

test("three.js on WebGL2 draws translucency in MathBox's order by default", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(redOverBlue().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await expect(canvas(page)).toHaveAttribute("data-backend", "webgl2");
  await expect(canvas(page)).toHaveAttribute("data-transparency", "ordered");
  await expectRedToHideBlue(page);
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
  await expect(canvas(page)).toHaveAttribute("data-transparency", "oit");
  await expectRedToHideBlue(page);

  const { width, height } = page.viewportSize()!;
  await page.setViewportSize({ width: width - 40, height });
  // The resized frame is the last one drawn: nothing asks for another.
  await page.waitForTimeout(500);
  await expectRedToHideBlue(page);
  expect(errors).toEqual([]);
});
