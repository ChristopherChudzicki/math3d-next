import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

// MathBox's still frame: `/app/frame/:key?renderer=mathbox` halts MathBox's
// render loop once the scene has drawn, then flags `data-scene-ready`. This
// guards against readiness firing before the graphics have rendered, which
// would capture a blank or half-drawn frame. See
// docs/superpowers/specs/2026-07-18-still-mode-readiness-handoff.md.
// `frame-renderers.test.ts` covers the default renderer.
test.use({ disable3d: false });

test("frame page captures the scene after it renders, not blank", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());

  await page.goto(`/app/frame/${key}?renderer=mathbox`);
  await page.waitForSelector('[data-testid="scene"][data-scene-ready="true"]', {
    timeout: 60_000,
  });
  const png = await page.getByTestId("scene").screenshot();
  const ratio = await colorfulPixelRatio(png);

  // A fully-rendered default explicit surface fills ~0.51 of the frame with
  // colored pixels; an empty scene (axes + grid only, i.e. what a too-early
  // capture at the warmup transient looks like) reads 0.0. 0.1 sits far above
  // that blank floor with a wide margin below the real render for GL-backend
  // variance.
  expect(ratio).toBeGreaterThan(0.1);
});
