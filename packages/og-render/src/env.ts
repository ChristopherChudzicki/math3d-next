import type { BrowserWorker } from "@cloudflare/puppeteer";

interface OgRenderEnv {
  /** R2 bucket holding cached PNGs (og/scene/{key}.png) and locks (og/lock/{key}). */
  OG_BUCKET: R2Bucket;
  /** Cloudflare Browser Rendering binding. */
  BROWSER: BrowserWorker;
  /** Fixed origin of the headless frame page, e.g. https://next.math3d.org. */
  FRAME_ORIGIN: string;
  /** Fixed API origin (ninja app mounted under /v1), e.g. https://api.math3d.org. */
  API_BASE: string;
}

export type Env = OgRenderEnv;

// `import { env } from "cloudflare:test"` (used by src/index.spec.ts) types `env`
// as `Cloudflare.Env`, an ambient interface declared (empty) by
// @cloudflare/workers-types. Merge our bindings into it so `env.OG_BUCKET` etc.
// typecheck in tests. A separately-named base interface avoids `Env` circularly
// extending itself, which is how @cloudflare/workers-types's own doc comment
// (and wrangler's generated worker-configuration.d.ts) recommends this be done.
declare global {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Env extends OgRenderEnv {}
  }
}
