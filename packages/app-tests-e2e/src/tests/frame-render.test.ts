import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

// The `/app/frame/:key` render page halts mathbox's render loop once the scene
// has drawn, then flags `data-scene-ready` for a headless screenshotter. The
// failure mode this guards against is capturing a blank or half-drawn frame:
// if readiness fires before the scene's graphics have rendered, the OG image is
// empty. See docs/superpowers/specs/2026-07-18-still-mode-readiness-handoff.md.
test.use({ disable3d: false });

/**
 * Fraction of pixels in a PNG screenshot that carry strong chroma (max channel
 * minus min channel), decoded via the browser's own image decoder and a 2D
 * canvas (no Node image library, and no unreliable WebGL read-back).
 *
 * Chroma is background-agnostic: white, black, and gray backgrounds, plus the
 * gray axes and grid lines, all read ~0, while the colored surface reads high.
 * So the metric isolates "the 3D surface actually drew" from a blank or
 * half-drawn capture, and is stable across GL backends (SwiftShader on CI vs a
 * real GPU locally) because it keys off gross color mass, not exact pixels.
 */
const colorfulPixelRatio = (page: Page, pngBase64: string): Promise<number> =>
  page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = `data:image/png;base64,${b64}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let colorful = 0;
    for (let i = 0; i < data.length; i += 4) {
      const chroma =
        Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      if (chroma > 40) colorful += 1;
    }
    return colorful / (data.length / 4);
  }, pngBase64);

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
