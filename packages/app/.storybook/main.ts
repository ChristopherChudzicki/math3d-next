import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

// The bundle visualizer opens a browser tab after every build, and the app's
// Content-Security-Policy would block Storybook's inline scripts.
const EXCLUDED_PLUGINS = new Set(["visualizer", "math3d:csp"]);
const isExcluded = (plugin: PluginOption) =>
  !!plugin && typeof plugin === "object" && "name" in plugin
    ? EXCLUDED_PLUGINS.has(plugin.name)
    : false;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "storybook-addon-pseudo-states"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  // Storybook merges the app's vite.config.ts, so the @/ alias and CSS Modules
  // work.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: (viteConfig.plugins ?? []).flat().filter((p) => !isExcluded(p)),
  }),
};

export default config;
