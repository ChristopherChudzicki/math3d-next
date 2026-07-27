/**
 * Generates the default OG social-share image
 * (`packages/app/public/og/default.png`, 1200x630) from the committed torus
 * scene + card layout. This is a build step, not an assertion, so it is guarded
 * behind OG_BUILD and skipped by the normal suite. Run it with:
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

// The frame page renders the 3D scene, so we need WebGL on and a large viewport.
test.use({
  disable3d: false,
  viewport: { width: OG_WIDTH * SCENE_SCALE, height: OG_HEIGHT * SCENE_SCALE },
});

test("build default OG image", async ({ page, prepareScene }) => {
  test.skip(
    !process.env.OG_BUILD,
    "OG image build step; run via `yarn og:build`",
  );

  // 1. Render the torus scene and screenshot it.
  const key = await prepareScene({ ...buildTorusScene(), title: "OG default" });
  await page.goto(`/app/frame/${key}`);
  await page.waitForSelector('[data-testid="scene"][data-scene-ready="true"]', {
    timeout: 60_000,
  });
  const raw = await page.getByTestId("scene").screenshot();

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
