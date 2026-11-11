import { expect } from "@playwright/test";
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
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// Without an adapter three.js falls back to WebGL2, which
// `threejs-transparency.test.ts` covers.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

test("three.js order-independent transparency on WebGPU tests depth, also after a resize", async ({
  page,
  prepareScene,
}) => {
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);
  const key = await prepareScene(redOverBlue().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  const canvas = page.getByTestId("scene").locator("canvas");
  await expect(canvas).toHaveAttribute("data-backend", "webgpu");
  await expect(canvas).toHaveAttribute("data-transparency", "oit");
  await expectRedToHideBlue(page);

  await narrowWindow(page);
  await expectRedToHideBlue(page);
  expect(errors).toEqual([]);
});

test("three.js order-independent transparency on WebGPU blends whatever the zOrder", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(blueFirstOverRed().json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  await sharesOnce(page, "blueOverRed");
  expect(errors).toEqual([]);
});
