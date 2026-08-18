import type { BrowserWorker } from "@cloudflare/puppeteer";

interface ScreenshotsEnv {
  /** R2 bucket holding cached PNGs (screenshots/scene/{key}.png). */
  SCREENSHOTS_BUCKET: R2Bucket;
  /** Cloudflare Browser Rendering binding. */
  BROWSER: BrowserWorker;
  /** Fixed origin of the headless frame page, e.g. https://next.math3d.org. */
  FRAME_ORIGIN: string;
}

export type Env = ScreenshotsEnv;

// `import { env } from "cloudflare:test"` (used by src/index.spec.ts) types `env`
// as `Cloudflare.Env`, an ambient interface declared (empty) by
// @cloudflare/workers-types. Merge our bindings into it so `env.SCREENSHOTS_BUCKET`
// etc. typecheck in tests. A separately-named base interface avoids `Env` circularly
// extending itself, which is how @cloudflare/workers-types's own doc comment
// (and wrangler's generated worker-configuration.d.ts) recommends this be done.
// `namespace` is required here (not an ES2015 module) — it's merging into the
// ambient `Cloudflare` namespace @cloudflare/workers-types itself declares, so
// `no-namespace` is disabled for this block only.
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Env extends ScreenshotsEnv {}
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
