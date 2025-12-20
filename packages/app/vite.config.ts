import path from "node:path";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import { Schema, ValidateEnv } from "@julr/vite-plugin-validate-env";
import compileTime from "vite-plugin-compile-time";
import { PluginOption } from "vite";
import fs from "fs/promises";

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

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    ValidateEnv({
      VITE_API_BASE_URL: Schema.string(),
      VITE_LEGACY_APP_BASE_URL: Schema.string(),
      VITE_ISSUE_URL: Schema.string(),
      VITE_APP_VERSION: Schema.string.optional(),
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
    docsHotReload(
      path.resolve(__dirname, "./src/pages/HelpPage/data.compile.ts"),
    ),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    clearMocks: true,
    setupFiles: ["./src/setupTests.ts"],
    environment: "jsdom",
    exclude: ["**/playwright/**"],
    include: ["./src/**/*.{test,spec}.{ts,tsx}"],
    css: {
      include: /\*.module.css/,
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
  },
  define: {
    __PLAYWRIGHT__: process.env.PLAYWRIGHT,
  },
});
