import puppeteer from "@cloudflare/puppeteer";
import type { Env } from "./env";
import { sceneFrameUrl } from "./keys";

const READY_SELECTOR = '[data-scene-ready="true"]';
const NAV_TIMEOUT_MS = 15_000; // page-load nav bound; RENDER_DEADLINE_MS is authoritative
// data-scene-ready is a wall-clock quiescence heuristic on mathbox warmup — give it
// headroom, but keep it below RENDER_DEADLINE_MS (the authoritative bound that closes
// the browser). Ordering: RENDER_DEADLINE_MS > READY_TIMEOUT_MS.
const READY_TIMEOUT_MS = 45_000;

export const withTimeout = async <T>(
  deadlineMs: number,
  fn: () => Promise<T>,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`render deadline ${deadlineMs}ms`)),
      deadlineMs,
    );
  });
  try {
    return await Promise.race([fn(), deadline]);
  } finally {
    clearTimeout(timer!);
  }
};

/**
 * Render {FRAME_ORIGIN}/app/frame/{key} to a 1200x630 PNG. Waits for the
 * still-mode readiness signal (data-scene-ready). Launch/close per render for v1
 * simplicity; browser reuse is a roadmap optimization. Throws on any failure —
 * the caller swallows.
 *
 * v1 framing decision: render at 1200x630, deviceScaleFactor 1 — exactly the
 * dimensions declared in index.html's og:image:width/height. The scene uses its
 * own saved camera; auto-framing and hi-DPI (2x, matching the default card's
 * crispness) are deferred polish, NOT v1.
 *
 * No credentials: a fresh puppeteer context navigates a bare same-origin URL, so
 * the browser sends no cookies/headers — it renders only what an anonymous
 * viewer sees (anonymous scenes are immutable, so no version-busting vector).
 *
 * `deadlineMs` (RENDER_DEADLINE_MS) bounds the whole page-work body via
 * `withTimeout`; `browser.close()` in `finally` closes at ~deadlineMs, aborting a
 * hung op.
 *
 * `launch` is a defaulted test-only injection seam (close-on-timeout can be
 * asserted with a fake browser); production uses `puppeteer.launch`.
 */
export const renderScene = async (
  env: Env,
  key: string,
  deadlineMs: number,
  launch: typeof puppeteer.launch = puppeteer.launch,
): Promise<Uint8Array> => {
  const browser = await launch(env.BROWSER);
  try {
    return await withTimeout(deadlineMs, async () => {
      const page = await browser.newPage();
      await page.setViewport({
        width: 1200,
        height: 630,
        deviceScaleFactor: 1,
      });
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
      return page.screenshot({ type: "png" });
    });
  } finally {
    await browser.close(); // runs on timeout too → closes at ~deadlineMs, aborting the hung op
  }
};
