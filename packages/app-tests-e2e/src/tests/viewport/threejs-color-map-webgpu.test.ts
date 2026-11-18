import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { colorMapPlanes, expectColorMapPlanes } from "@/utils/colorMapPlanes";
import { expectThreeViewport } from "@/utils/threeViewport";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// Without an adapter three.js falls back to WebGL2, which
// `threejs-color-map.test.ts` covers.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

test("three.js draws a color map with an outer mod per pixel on the WebGPU backend", async ({
  page,
  prepareScene,
}) => {
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);
  const key = await prepareScene(colorMapPlanes().json());
  await page.goto(`/app/frame/${key}?renderer=threejs`);

  await expectThreeViewport(page);
  await expectColorMapPlanes(page);
  await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
    "data-backend",
    "webgpu",
  );
  expect(errors).toEqual([]);
});
