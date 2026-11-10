import { defineConfig } from "vitest/config";

// Node has neither WebGPU nor WebGL, so only pure code is unit-tested here;
// E2E covers drawing.
export default defineConfig({
  test: {
    environment: "node",
  },
});
