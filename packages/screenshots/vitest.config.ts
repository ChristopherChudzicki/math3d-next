import { defineProject } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// Runs in workerd via @cloudflare/vitest-pool-workers so runtime globals
// (HTMLRewriter, R2) exist. r2Buckets gives tests a REAL in-memory R2 binding
// (env.SCREENSHOTS_BUCKET from "cloudflare:test") to exercise the cache
// get/put semantics for real. Keep compatibilityDate in sync with
// wrangler.jsonc.
export default defineProject({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-07-04",
        r2Buckets: ["SCREENSHOTS_BUCKET"],
        // Plain-text vars are `bindings` in miniflare (NOT `vars` — that's the
        // wrangler.jsonc spelling). This surfaces as env.FRAME_ORIGIN via
        // `import { env } from "cloudflare:test"`.
        bindings: {
          FRAME_ORIGIN: "https://next.math3d.org",
        },
      },
    }),
  ],
  test: {
    name: "screenshots",
    include: ["./src/**/*.{test,spec}.ts"],
  },
});
