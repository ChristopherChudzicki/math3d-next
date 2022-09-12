import path from "path";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    react(),
    viteTsconfigPaths(),
    visualizer({
      filename: "dist/stats.html",
      template: "sunburst",
      open: true,
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
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
