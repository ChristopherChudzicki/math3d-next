import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { hideGpu } from "@/utils/hideGpu";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

// `/app/frame/:key?renderer=` draws with the renderer it names and marks the
// scene `data-scene-ready` once drawn and settled. `frame-render.test.ts`
// covers MathBox.
test.use({ disable3d: false });

test("?renderer=threejs is ready once the scene is drawn and settled", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());

  await page.goto(`/app/frame/${key}?renderer=threejs`);
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
    timeout: 30_000,
  });
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  const ready = await viewport.screenshot();
  // A default explicit surface; an empty scene reads 0 (`frame-render.test.ts`).
  expect(await colorfulPixelRatio(ready)).toBeGreaterThan(0.1);
  await page.waitForTimeout(500);
  expect((await viewport.screenshot()).equals(ready)).toBe(true);
});

test("a renderer that can't start marks the frame failed, with no fallback", async ({
  page,
  prepareScene,
}) => {
  await hideGpu(page);
  const key = await prepareScene(new SceneBuilder().json());

  await page.goto(`/app/frame/${key}?renderer=threejs`);
  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-scene-error", "unsupported", {
    timeout: 15_000,
  });
  await expect(viewport).toHaveAttribute("data-renderer", "threejs");
  await expect(viewport).not.toHaveAttribute("data-scene-ready");
});
