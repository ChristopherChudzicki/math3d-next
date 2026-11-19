import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { labelBox, labelInSphere, labelOverSurface } from "@/utils/threeLabels";
import { expectThreeViewport } from "@/utils/threeViewport";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// Without an adapter three.js falls back to WebGL2, which
// `threejs-labels.test.ts` covers.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

test("on WebGPU, a label draws whole over a surface that tilts across it, and not at all inside a solid", async ({
  page,
  prepareScene,
}) => {
  // It loads three scenes.
  test.slow();
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);
  const canvas = page.getByTestId("scene").locator("canvas");
  const boxIn = async (scene: ReturnType<typeof labelInSphere>) => {
    const key = await prepareScene(scene.json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);
    await expectThreeViewport(page);
    await expect(canvas).toHaveAttribute("data-backend", "webgpu");
    await expect(canvas).toHaveAttribute("data-transparency", "oit");
    return labelBox(page);
  };

  const tilted = await boxIn(labelOverSurface("x+y"));
  const flatBelow = await boxIn(labelOverSurface("-1"));
  const inSphere = await boxIn(labelInSphere());

  expect(flatBelow, "the label drew").not.toBeNull();
  expect(tilted).toEqual(flatBelow);
  expect(inSphere).toBeNull();
  expect(errors).toEqual([]);
});
