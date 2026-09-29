import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

const isVisualizer = (plugin: PluginOption) =>
  !!plugin && typeof plugin === "object" && "name" in plugin
    ? plugin.name === "visualizer"
    : false;

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y", "storybook-addon-pseudo-states"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  // Storybook merges the app's vite.config.ts, so the @/ alias and CSS Modules
  // work. Drop the bundle visualizer: it opens a browser tab after every build.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: (viteConfig.plugins ?? []).flat().filter((p) => !isVisualizer(p)),
  }),
};

export default config;
