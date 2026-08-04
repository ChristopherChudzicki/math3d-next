/**
 * Generates the default OG social-share image
 * (`packages/app/public/og/default.png`, 1200x630) from the committed torus
 * scene + card layout. This is a build step, not an assertion, so the whole file
 * is skipped unless OG_BUILD is set (the file-scope `test.skip` below skips it
 * at collection, before any fixture/browser setup). Run it with:
 *
 *   yarn workspace app-tests-e2e og:build
 *
 * Pipeline: render `buildTorusScene()` through the /app/frame page at 2x and
 * screenshot it -> trim to the torus -> drop that into `buildCardHtml` -> render
 * the card and screenshot at exact OG size -> write default.png.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import sharp from "sharp";
import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";
import { buildTorusScene } from "./scene";
import { buildCardHtml, type CardFont } from "./card";

const require = createRequire(import.meta.url);

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** Render the scene at 2x so the trimmed torus downscales crisply into the card. */
const SCENE_SCALE = 2;

const readFont = (weight: number): CardFont => {
  const file = require.resolve(
    `@fontsource/roboto/files/roboto-latin-${weight}-normal.woff2`,
  );
  return { weight, base64: fs.readFileSync(file).toString("base64") };
};

const outPath = () => {
  const root = process.env.PROJECT_CWD;
  if (!root) throw new Error("PROJECT_CWD not set (run via yarn)");
  return path.join(root, "packages/app/public/og/default.png");
};

// Skip the whole file unless building the OG image. At file scope this runs at
// collection, so on a normal `yarn test-e2e` run no fixture or browser context
// is created for it (unlike a `test.skip` inside the body, which skips only
// after fixtures resolve).
test.skip(
  !process.env.OG_BUILD,
  "OG image build step; run via `yarn og:build`",
);

// The frame page renders the 3D scene, so we need WebGL on and a large viewport.
test.use({
  disable3d: false,
  viewport: { width: OG_WIDTH * SCENE_SCALE, height: OG_HEIGHT * SCENE_SCALE },
});

test("build default OG image", async ({ page, prepareScene }) => {
  // 1. Render the torus scene and screenshot it.
  const key = await prepareScene({ ...buildTorusScene(), title: "OG default" });
  await page.goto(`/app/frame/${key}`);
  await page.waitForSelector('[data-testid="scene"][data-scene-ready="true"]', {
    timeout: 60_000,
  });
  const raw = await page.getByTestId("scene").screenshot();

  // `data-scene-ready` is a wall-clock quiescence heuristic, not a hard paint
  // guarantee, and this asset ships to production — so verify the torus actually
  // drew before we trim and compose. A blank or axes/grid-only capture (gray
  // lines carry ~0 chroma) reads ~0; the fully-rendered torus + helix fills
  // ~0.086 of this 2x frame. 0.04 sits well above the blank floor and well below
  // the real render for GL-backend variance. Assert on `raw`: after setContent
  // the page is the card, not the scene.
  const ratio = await colorfulPixelRatio(page, raw.toString("base64"));
  expect(ratio).toBeGreaterThan(0.04);

  // 2. Trim the uniform background so the torus fills the card's lower band.
  const trimmed = await sharp(raw).trim().png().toBuffer();
  const sceneDataUri = `data:image/png;base64,${trimmed.toString("base64")}`;

  // 3. Compose the card (title + tagline + torus) and screenshot at OG size.
  const html = buildCardHtml({
    title: "Math3d.org",
    tagline: "create • animate • share",
    sceneDataUri,
    fonts: [readFont(400), readFont(500)],
    width: OG_WIDTH,
    height: OG_HEIGHT,
  });
  await page.setViewportSize({ width: OG_WIDTH, height: OG_HEIGHT });
  await page.setContent(html, { waitUntil: "networkidle" });
  const png = await page.locator(".card").screenshot();

  const dest = outPath();
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, png);

  expect(png.length).toBeGreaterThan(0);
});
