import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

// The `/app/frame/:key` render page halts mathbox's render loop once the scene
// has drawn, then flags `data-scene-ready` for a headless screenshotter. The
// failure mode this guards against is capturing a blank or half-drawn frame:
// if readiness fires before the scene's graphics have rendered, the OG image is
// empty. See docs/superpowers/specs/2026-07-18-still-mode-readiness-handoff.md.
test.use({ disable3d: false });

test("frame page captures the scene after it renders, not blank", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());

  await page.goto(`/app/frame/${key}`);
  await page.waitForSelector('[data-testid="scene"][data-scene-ready="true"]', {
    timeout: 60_000,
  });
  const png = await page.getByTestId("scene").screenshot();
  const ratio = await colorfulPixelRatio(page, png.toString("base64"));

  // A fully-rendered default explicit surface fills ~0.51 of the frame with
  // colored pixels; an empty scene (axes + grid only, i.e. what a too-early
  // capture at the warmup transient looks like) reads 0.0. 0.1 sits far above
  // that blank floor with a wide margin below the real render for GL-backend
  // variance.
  expect(ratio).toBeGreaterThan(0.1);
});
