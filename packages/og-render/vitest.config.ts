import { defineProject } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

// Runs in workerd via @cloudflare/vitest-pool-workers so runtime globals
// (HTMLRewriter, R2) exist. r2Buckets gives tests a REAL in-memory R2 binding
// (env.OG_BUCKET from "cloudflare:test") — required to exercise the conditional-
// put lock semantics for real (Task 3). Keep compatibilityDate in sync with
// wrangler.jsonc.
export default defineProject({
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-07-04",
        r2Buckets: ["OG_BUCKET"],
        // Plain-text vars are `bindings` in miniflare (NOT `vars` — that's the
        // wrangler.jsonc spelling). These surface as env.FRAME_ORIGIN / env.API_BASE
        // via `import { env } from "cloudflare:test"`.
        bindings: {
          FRAME_ORIGIN: "https://next.math3d.org",
          API_BASE: "https://api.math3d.org",
        },
      },
    }),
  ],
  test: {
    name: "og-render",
    include: ["./src/**/*.{test,spec}.ts"],
  },
});
