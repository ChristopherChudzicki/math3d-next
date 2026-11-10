import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { coloredShare, expectThreeViewport } from "@/utils/threeViewport";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// Without an adapter three.js falls back to WebGL2, which
// `threejs-renderer.test.ts` covers.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

test("three.js draws lines on the WebGPU backend", async ({
  page,
  prepareScene,
}) => {
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);
  const scene = new SceneBuilder();
  scene.folder().vector({ width: "20" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  expect(await coloredShare(page)).toBeGreaterThan(0.002);
  await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
    "data-backend",
    "webgpu",
  );
  expect(errors).toEqual([]);
});
