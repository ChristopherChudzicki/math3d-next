import type { Page } from "@playwright/test";

/** Hides any real WebGPU adapter, so the no-WebGPU path runs on every machine. */
export const hideWebGpu = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", {
      value: { requestAdapter: async () => null },
      configurable: true,
    });
  });
