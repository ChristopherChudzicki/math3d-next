import { defineProject } from "vitest/config";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";

/**
 * Vitest project for the edge OG Worker (src/worker). It runs inside workerd
 * (via @cloudflare/vitest-pool-workers) so runtime-only globals like
 * HTMLRewriter exist — they don't under jsdom, where the rest of the app tests.
 *
 * This project is deliberately standalone (not `extends`-ing vite.config.ts):
 * it must NOT inherit the app's react/validate-env plugins or setupTests.ts,
 * which pull in jsdom/Testing-Library globals the pool disallows.
 *
 * The worker unit tests import the worker and build `env` by hand (mocking the
 * ASSETS binding), so they need no wrangler `assets`/`main` wiring — only a
 * compatibility date for workerd. Keep this date in sync with wrangler.jsonc.
 */
export default defineProject({
  plugins: [
    cloudflareTest({
      miniflare: { compatibilityDate: "2026-07-04" },
    }),
  ],
  test: {
    name: "workers",
    include: ["./src/worker/**/*.{test,spec}.ts"],
  },
});
