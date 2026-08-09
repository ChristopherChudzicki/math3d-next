import puppeteer from "@cloudflare/puppeteer";
import type { Env } from "./env";
import { sceneFrameUrl } from "./keys";

const READY_SELECTOR = '[data-scene-ready="true"]';
const NAV_TIMEOUT_MS = 30_000;
const READY_TIMEOUT_MS = 20_000;

/**
 * Render {FRAME_ORIGIN}/app/frame/{key} to a 1200x630 PNG. Waits for the
 * still-mode readiness signal (data-scene-ready), validated on real CF Browser
 * Rendering (2026-08-08). Launch/close per render for v1 simplicity; browser
 * reuse is a roadmap optimization. Throws on any failure — the caller swallows.
 *
 * v1 framing decision: render at 1200x630, deviceScaleFactor 1 — exactly the
 * dimensions declared in index.html's og:image:width/height. The scene uses its
 * own saved camera (the validation PNG sat small/off-center); auto-framing and
 * hi-DPI (2x, matching the default card's crispness) are deferred polish, NOT v1.
 *
 * No credentials: a fresh puppeteer context navigates a bare same-origin URL, so
 * the browser sends no cookies/headers — it renders only what an anonymous
 * viewer sees (anonymous scenes are immutable, so no version-busting vector).
 */
export const renderScene = async (
  env: Env,
  key: string,
): Promise<Uint8Array> => {
  const browser = await puppeteer.launch(env.BROWSER);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.goto(sceneFrameUrl(env, key), {
      waitUntil: "networkidle0",
      timeout: NAV_TIMEOUT_MS,
    });
    await page.waitForSelector(READY_SELECTOR, { timeout: READY_TIMEOUT_MS });
    // @cloudflare/puppeteer 1.3.0's `screenshot({ type: "png" })` resolves a
    // Node `Buffer`, not a plain `Uint8Array` (its .d.ts pulls in `@types/node`
    // via a triple-slash reference). `Buffer` extends `Uint8Array`, so this is
    // a safe upcast rather than an unchecked `as` — no runtime conversion
    // needed since `renderAndCache` only ever passes the result straight to
    // `R2Bucket#put`, which accepts any `ArrayBufferView`.
    const shot = await page.screenshot({ type: "png" });
    return shot;
  } finally {
    await browser.close();
  }
};
