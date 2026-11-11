import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

test("?renderer=usegpu draws with the Use.GPU viewport", async ({
  page,
  prepareScene,
}) => {
  // Use.GPU reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  // `frame-render.test.ts` calibrates the 0.1 threshold below with no controls
  // sidebar.
  await page.goto(`/${key}?renderer=usegpu&controls=0`);

  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "usegpu");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
    timeout: 15_000,
  });
  // An empty scene (axes and grid only) reads 0; see `frame-render.test.ts`.
  expect(await colorfulPixelRatio(await viewport.screenshot())).toBeGreaterThan(
    0.1,
  );
  expect(errors).toEqual([]);
});
