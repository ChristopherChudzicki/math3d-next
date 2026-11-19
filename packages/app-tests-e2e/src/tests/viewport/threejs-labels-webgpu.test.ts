import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import type { Fixtures } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import {
  labelBox,
  labelInSphere,
  labelOverSurface,
  labelUnderThinLine,
} from "@/utils/threeLabels";
import { expectThreeViewport } from "@/utils/threeViewport";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// Without an adapter three.js falls back to WebGL2, which
// `threejs-labels.test.ts` covers.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

/** The label's box in `scene`, drawn on WebGPU, order-independently. */
const boxIn = async (
  page: Page,
  prepareScene: Fixtures["prepareScene"],
  scene: SceneBuilder,
) => {
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);
  await expectThreeViewport(page);
  const canvas = page.getByTestId("scene").locator("canvas");
  await expect(canvas).toHaveAttribute("data-backend", "webgpu");
  await expect(canvas).toHaveAttribute("data-transparency", "oit");
  return labelBox(page);
};

test("on WebGPU, a label draws whole over a surface that tilts across it, and not at all inside a solid", async ({
  page,
  prepareScene,
}) => {
  // It loads three scenes.
  test.slow();
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);

  const tilted = await boxIn(page, prepareScene, labelOverSurface("x+y"));
  const flatBelow = await boxIn(page, prepareScene, labelOverSurface("-1"));
  const inSphere = await boxIn(page, prepareScene, labelInSphere());

  expect(flatBelow, "the label drew").not.toBeNull();
  expect(tilted).toEqual(flatBelow);
  expect(inSphere).toBeNull();
  expect(errors).toEqual([]);
});

test("on WebGPU, a label off the view's center shows where a thin line crosses its anchor", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);

  const box = await boxIn(page, prepareScene, labelUnderThinLine());

  expect(box).not.toBeNull();
  expect(errors).toEqual([]);
});
