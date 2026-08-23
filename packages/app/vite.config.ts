import path from "node:path";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { Schema, ValidateEnv } from "@julr/vite-plugin-validate-env";
import compileTime from "vite-plugin-compile-time";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import type { PluginOption } from "vite";
import fs from "fs/promises";
import { realpathSync } from "node:fs";

/**
 * ./src/pages/HelpPage/data.compile.ts
 * file is generated at compile-time.
 *
 * It uses fs.readFileSync to load dependencies.
 * Because those dependences are not loaded by a normal import,
 * vite's hot reload does not work.
 *
 * This plugin watches for changes in the markdown files, then re-saves the
 * data.compile.ts file.
 */
const docsHotReload = (filepath: string): PluginOption => {
  return {
    name: "docs-hot-reload",
    async handleHotUpdate({ file }) {
      if (file.includes("docs") && file.endsWith(".md")) {
        await fs.writeFile(filepath, await fs.readFile(filepath));
      }
    },
  };
};

/**
 * Identify which checkout this server serves, so the e2e suite can refuse to
 * run against another checkout's server (git worktrees share the backend and
 * can inherit each other's ports; see global.setup.ts in app-tests-e2e).
 * Dev/preview servers only — production is a static build on a CDN, which
 * never runs these hooks.
 */
const checkoutIdentity = (): PluginOption => {
  // realpath'd so symlinked checkout paths compare equal.
  const checkoutRoot = realpathSync(path.resolve(__dirname, "../.."));
  const addHeader: import("vite").Connect.NextHandleFunction = (
    _req,
    res,
    next,
  ) => {
    res.setHeader("X-Checkout-Root", checkoutRoot);
    next();
  };
  return {
    name: "checkout-identity",
    configureServer(server) {
      server.middlewares.use(addHeader);
    },
    configurePreviewServer(server) {
      server.middlewares.use(addHeader);
    },
  };
};

// Derive server host/port from APP_BASE_URL so local dev and CI can share
// the same config without hardcoding math3d.localdev. Locally this comes
// from direnv loading .env.development; in CI it comes from a GitHub var.
const appUrl = new URL(process.env.APP_BASE_URL ?? "http://localhost:3000");

// Only when a token is present: `yarn build` runs tokenless in e2e.yml and in
// the rc dry_run, and the jsdom vitest project inherits this plugins array.
const sentryPlugins = (): PluginOption[] => {
  const authToken = process.env.SENTRY_ORG_TOKEN;
  if (!authToken) return [];
  // A token means this is a release build, so an incomplete upload config is a
  // bug: `errorHandler` below would otherwise reduce it to a warning.
  const release = process.env.VITE_APP_VERSION;
  const project = process.env.SENTRY_PROJECT;
  if (!release || !project) {
    const missing = [
      !release && "VITE_APP_VERSION",
      !project && "SENTRY_PROJECT",
    ].filter(Boolean);
    throw new Error(
      `SENTRY_ORG_TOKEN is set but source-map upload is misconfigured (missing: ${missing.join(", ")}); Sentry would show minified stack traces for this release.`,
    );
  }
  // An org token carries its own org, which is why no SENTRY_ORG is needed; the
  // plugin skips the org requirement on exactly this prefix.
  if (!authToken.startsWith("sntrys_")) {
    throw new Error(
      "SENTRY_ORG_TOKEN must be a Sentry organization auth token (prefix `sntrys_`); other token types also need an org slug, which this build does not supply.",
    );
  }
  return [
    sentryVitePlugin({
      project,
      authToken,
      release: { name: release },
      // The plugin throws by default; a Sentry outage must not fail a release.
      errorHandler: (err) => {
        // eslint-disable-next-line no-console
        console.warn("Sentry source map upload failed:", err);
      },
    }),
  ];
};

export default defineConfig({
  server: {
    port: Number(appUrl.port) || 3000,
    // The exact port is load-bearing: backend CORS/CSRF trust and Playwright's
    // server-reuse probe both key on it. Fail loudly rather than silently
    // serving on port+1.
    strictPort: true,
    host: appUrl.hostname,
    allowedHosts: [appUrl.hostname],
  },
  // `vite preview` inherits host/allowedHosts from `server` but not port, so
  // derive it here too to keep the port single-sourced from APP_BASE_URL.
  preview: {
    port: Number(appUrl.port) || 3000,
    strictPort: true,
  },
  plugins: [
    ValidateEnv({
      VITE_API_BASE_URL: Schema.string(),
      VITE_LEGACY_APP_BASE_URL: Schema.string(),
      VITE_ISSUE_URL: Schema.string(),
      VITE_SITE_ORIGIN: Schema.string(),
      VITE_APP_VERSION: Schema.string.optional(),
      VITE_DISPLAY_AUTH_FLOWS: Schema.string.optional(),
      VITE_SENTRY_DSN: Schema.string.optional(),
    }),
    react(),
    viteTsconfigPaths(),
    visualizer({
      filename: "dist/stats.html",
      template: "sunburst",
      open: true,
      gzipSize: true,
    }),
    compileTime(),
    checkoutIdentity(),
    docsHotReload(
      path.resolve(__dirname, "./src/pages/HelpPage/data.compile.ts"),
    ),
    ...sentryPlugins(),
  ],
  build: {
    // Uploaded to Sentry AND shipped to the CDN — math3d is open source.
    // Expect a "Sourcemap is likely to be incorrect" warning: it comes from
    // vite-plugin-compile-time, whose output never appears in a stack trace.
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        // The app's jsdom tests. `extends: true` inherits this file's plugins
        // and resolve (react, tsconfig paths, validate-env). The worker tests
        // live in a separate workerd project (vitest.worker.config.ts) and are
        // excluded here so they don't run under jsdom.
        extends: true,
        test: {
          name: "jsdom",
          globals: true,
          clearMocks: true,
          setupFiles: ["./src/setupTests.ts"],
          environment: "jsdom",
          env: {
            VITE_DISPLAY_AUTH_FLOWS: "true",
          },
          exclude: ["**/playwright/**", "./src/worker/**"],
          include: ["./src/**/*.{test,spec}.{ts,tsx}"],
          css: {
            include: /\*.module.css/,
            modules: {
              classNameStrategy: "non-scoped",
            },
          },
        },
      },
      "./vitest.worker.config.ts",
    ],
  },
});
