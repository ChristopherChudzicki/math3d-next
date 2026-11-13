import {
  RENDERER_PREFERENCE_KEY,
  resetRendererPreference,
} from "@/services/renderer/rendererPreference";

// The preference store reads localStorage once per reset, so a stored value
// must go through this helper to be seen.
const storeRendererPreference = (renderer: string): void => {
  localStorage.setItem(RENDERER_PREFERENCE_KEY, renderer);
  resetRendererPreference();
};

export { storeRendererPreference };
