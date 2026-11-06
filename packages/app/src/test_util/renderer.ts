import {
  RENDERER_PREFERENCE_KEY,
  resetRendererPreference,
} from "@/services/renderer/rendererPreference";
import { resetWebGpuSupport } from "@/services/renderer/webgpuSupport";

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

const storeRendererPreference = (renderer: string): void => {
  localStorage.setItem(RENDERER_PREFERENCE_KEY, renderer);
  resetRendererPreference();
};

export { storeRendererPreference, stubWebGpu };
