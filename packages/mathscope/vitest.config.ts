import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "./packages/mathscope/tsconfig.json",
    },
  },
});
