import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { hideWebGpu } from "@/utils/hideWebGpu";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";
import { webgpuLaunchOptions } from "@/utils/webgpuLaunchOptions";

// `/app/frame/:key?renderer=` draws with the renderer it names and marks the
// scene `data-scene-ready` once drawn and settled. `frame-render.test.ts`
// covers MathBox, the default.
test.use({ disable3d: false, launchOptions: webgpuLaunchOptions });

["threejs", "usegpu"].forEach((renderer) => {
  test(`?renderer=${renderer} is ready once the scene is drawn and settled`, async ({
    page,
    prepareScene,
  }) => {
    const scene = new SceneBuilder();
    scene.folder({ description: "Surface" }).explicitSurface();
    const key = await prepareScene(scene.json());

    await page.goto(`/app/frame/${key}?renderer=${renderer}`);
    const viewport = page.getByTestId("scene");
    await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
      timeout: 30_000,
    });
    await expect(viewport).toHaveAttribute("data-renderer", renderer);
    const ready = await viewport.screenshot();
    // A default explicit surface; an empty scene reads 0 (`frame-render.test.ts`).
    expect(await colorfulPixelRatio(ready)).toBeGreaterThan(0.1);
    await page.waitForTimeout(500);
    expect((await viewport.screenshot()).equals(ready)).toBe(true);
  });
});

test("a renderer that can't start marks the frame failed, with no fallback", async ({
  page,
  prepareScene,
}) => {
  await hideWebGpu(page);
  const key = await prepareScene(new SceneBuilder().json());

  await page.goto(`/app/frame/${key}?renderer=usegpu`);
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-scene-error", "unsupported", {
    timeout: 15_000,
  });
  await expect(viewport).toHaveAttribute("data-renderer", "usegpu");
  await expect(viewport).not.toHaveAttribute("data-scene-ready");
});
