import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { expectThreeViewport } from "@/utils/threeViewport";
import {
  expectRedToHideBlue,
  expectSameColor,
  narrowWindow,
  overlapColor,
  redOverBlue,
  translucentPair,
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

test("three.js order-independent transparency on WebGPU blends two translucent items alike in either zOrder", async ({
  page,
  prepareScene,
}) => {
  // It loads two scenes.
  test.slow();
  const errors = collectPageErrors(page);
  const canvas = page.getByTestId("scene").locator("canvas");
  const overlapWith = async (first: "blue" | "red") => {
    const key = await prepareScene(translucentPair(first).json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);
    await expectThreeViewport(page);
    await expect(canvas).toHaveAttribute("data-backend", "webgpu");
    await expect(canvas).toHaveAttribute("data-transparency", "oit");
    return overlapColor(page);
  };

  const blueFirst = await overlapWith("blue");
  const redFirst = await overlapWith("red");
  expectSameColor(redFirst, blueFirst);
  expect(errors).toEqual([]);
});
