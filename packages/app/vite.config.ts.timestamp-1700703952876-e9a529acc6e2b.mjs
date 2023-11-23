// vite.config.ts
import path from "node:path";
import { defineConfig } from "file:///Users/cchudzicki/dev/math3d-next/node_modules/vitest/dist/config.js";
import { visualizer } from "file:///Users/cchudzicki/dev/math3d-next/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import react from "file:///Users/cchudzicki/dev/math3d-next/node_modules/@vitejs/plugin-react/dist/index.mjs";
import viteTsconfigPaths from "file:///Users/cchudzicki/dev/math3d-next/node_modules/vite-tsconfig-paths/dist/index.mjs";
import {
  Schema,
  ValidateEnv,
} from "file:///Users/cchudzicki/dev/math3d-next/node_modules/@julr/vite-plugin-validate-env/dist/index.mjs";
var __vite_injected_original_dirname =
  "/Users/cchudzicki/dev/math3d-next/packages/app";
var vite_config_default = defineConfig({
  server: {
    port: 3e3,
  },
  plugins: [
    ValidateEnv({
      VITE_API_BASE_URL: Schema.string(),
    }),
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
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
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
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvY2NodWR6aWNraS9kZXYvbWF0aDNkLW5leHQvcGFja2FnZXMvYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvY2NodWR6aWNraS9kZXYvbWF0aDNkLW5leHQvcGFja2FnZXMvYXBwL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9jY2h1ZHppY2tpL2Rldi9tYXRoM2QtbmV4dC9wYWNrYWdlcy9hcHAvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZXN0L2NvbmZpZ1wiO1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB2aXRlVHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IHsgU2NoZW1hLCBWYWxpZGF0ZUVudiB9IGZyb20gXCJAanVsci92aXRlLXBsdWdpbi12YWxpZGF0ZS1lbnZcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMCxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIFZhbGlkYXRlRW52KHtcbiAgICAgIFZJVEVfQVBJX0JBU0VfVVJMOiBTY2hlbWEuc3RyaW5nKCksXG4gICAgfSksXG4gICAgcmVhY3QoKSxcbiAgICB2aXRlVHNjb25maWdQYXRocygpLFxuICAgIHZpc3VhbGl6ZXIoe1xuICAgICAgZmlsZW5hbWU6IFwiZGlzdC9zdGF0cy5odG1sXCIsXG4gICAgICB0ZW1wbGF0ZTogXCJzdW5idXJzdFwiLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgIH0pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIHRlc3Q6IHtcbiAgICBnbG9iYWxzOiB0cnVlLFxuICAgIGNsZWFyTW9ja3M6IHRydWUsXG4gICAgc2V0dXBGaWxlczogW1wiLi9zcmMvc2V0dXBUZXN0cy50c1wiXSxcbiAgICBlbnZpcm9ubWVudDogXCJqc2RvbVwiLFxuICAgIGV4Y2x1ZGU6IFtcIioqL3BsYXl3cmlnaHQvKipcIl0sXG4gICAgaW5jbHVkZTogW1wiLi9zcmMvKiovKi57dGVzdCxzcGVjfS57dHMsdHN4fVwiXSxcbiAgICBjc3M6IHtcbiAgICAgIGluY2x1ZGU6IC9cXCoubW9kdWxlLmNzcy8sXG4gICAgICBtb2R1bGVzOiB7XG4gICAgICAgIGNsYXNzTmFtZVN0cmF0ZWd5OiBcIm5vbi1zY29wZWRcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgX19QTEFZV1JJR0hUX186IHByb2Nlc3MuZW52LlBMQVlXUklHSFQsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNFQsT0FBTyxVQUFVO0FBQzdVLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsa0JBQWtCO0FBQzNCLE9BQU8sV0FBVztBQUNsQixPQUFPLHVCQUF1QjtBQUM5QixTQUFTLFFBQVEsbUJBQW1CO0FBTHBDLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxZQUFZO0FBQUEsTUFDVixtQkFBbUIsT0FBTyxPQUFPO0FBQUEsSUFDbkMsQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBLElBQ04sa0JBQWtCO0FBQUEsSUFDbEIsV0FBVztBQUFBLE1BQ1QsVUFBVTtBQUFBLE1BQ1YsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLElBQ1osQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE1BQU07QUFBQSxJQUNKLFNBQVM7QUFBQSxJQUNULFlBQVk7QUFBQSxJQUNaLFlBQVksQ0FBQyxxQkFBcUI7QUFBQSxJQUNsQyxhQUFhO0FBQUEsSUFDYixTQUFTLENBQUMsa0JBQWtCO0FBQUEsSUFDNUIsU0FBUyxDQUFDLGlDQUFpQztBQUFBLElBQzNDLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQLG1CQUFtQjtBQUFBLE1BQ3JCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLGdCQUFnQixRQUFRLElBQUk7QUFBQSxFQUM5QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
