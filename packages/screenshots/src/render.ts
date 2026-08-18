import puppeteer from "@cloudflare/puppeteer";
import type { Env } from "./env";
import { sceneFrameUrl } from "./keys";

const READY_SELECTOR = '[data-scene-ready="true"]';
const NAV_TIMEOUT_MS = 15_000; // lowered from 30s; RENDER_DEADLINE_MS is authoritative
// The only in-repo calibration of how long data-scene-ready takes is the e2e
// waiting on the same selector with a 60s budget (frame-render.test.ts).
// `networkidle0` above absorbs page load before this wait begins, which narrows
// the gap, but data-scene-ready is a wall-clock quiescence heuristic on mathbox
// warmup — so give it real headroom. Kept below RENDER_DEADLINE_MS (45s < 60s,
// per the ordering invariant PAGE_DEADLINE_MS > RENDER_DEADLINE_MS >
// READY_TIMEOUT_MS) so a per-step ready-wait can't outlast the authoritative
// render deadline, which is what actually bounds and closes the browser.
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
 *
 * `deadlineMs` (RENDER_DEADLINE_MS from the caller) bounds the whole page-work
 * body via `withTimeout`, and `browser.close()` runs in `finally` — so a hung
 * page operation is aborted by closing the browser at ~deadlineMs, not left
 * running. Headroom note: NAV_TIMEOUT_MS (15s) + READY_TIMEOUT_MS (45s) = 60s =
 * RENDER_DEADLINE_MS, so in the pathological nested-timeout case the per-step
 * guards can sum to the whole deadline, leaving no margin for
 * newPage/screenshot/close. This doesn't break the bound — the deadline still
 * hard-closes the browser, and CF idle-reap backstops `close` — so don't expect
 * RENDER_DEADLINE_MS to fire *before* the step guards in that worst case.
 *
 * `launch` is a defaulted, test-only injection seam so the close-on-timeout
 * behavior can be asserted with a fake browser. Production always uses the
 * default `puppeteer.launch`; the extra defaulted param keeps renderScene
 * assignable to the `Renderer` type `(env, key, deadlineMs) => Promise<…>`.
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
