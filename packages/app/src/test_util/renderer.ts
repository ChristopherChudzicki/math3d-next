import {
  resetRendererPreference,
  resetWebGpuSupport,
} from "@/services/renderer";
import type { Renderer } from "@/services/renderer";
import { RENDERER_PREFERENCE_KEY } from "@/services/renderer/rendererPreference";

// The renderer stores read navigator and localStorage once per reset, so a
// stub must go through these helpers to be seen.
const stubWebGpu = (
  requestAdapter: () => Promise<unknown> = async () => ({}),
): void => {
  Object.defineProperty(navigator, "gpu", {
    value: { requestAdapter },
    configurable: true,
  });
  resetWebGpuSupport();
};

const storeRendererPreference = (renderer: Renderer | string): void => {
  localStorage.setItem(RENDERER_PREFERENCE_KEY, renderer);
  resetRendererPreference();
};

export { storeRendererPreference, stubWebGpu };
