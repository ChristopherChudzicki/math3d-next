import type { Page } from "@playwright/test";

/** Hides WebGPU and WebGL2, so three.js can't start. */
export const hideGpu = (page: Page) =>
  page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", {
      value: { requestAdapter: async () => null },
      configurable: true,
    });
    const { getContext } = HTMLCanvasElement.prototype;
    HTMLCanvasElement.prototype.getContext = function hidden(
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      if (type === "webgl2" || type === "webgpu") return null;
      return getContext.call(this, type, ...rest);
    } as typeof getContext;
  });
