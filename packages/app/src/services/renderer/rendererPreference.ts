import { useSyncExternalStore } from "react";
import { isRenderer } from "./renderers";
import type { Renderer } from "./renderers";

// Not `rendererPreference`: choices there were made while MathBox was the
// default, so `mathbox` there mostly means "the default".
const RENDERER_PREFERENCE_KEY = "renderer";

// Blocked site data makes storage access throw; the choice then lasts only as
// long as the page.
const read = (): Renderer | null => {
  try {
    const stored = localStorage.getItem(RENDERER_PREFERENCE_KEY);
    return isRenderer(stored) ? stored : null;
  } catch {
    return null;
  }
};

let preference = read();
const listeners = new Set<() => void>();

const setPreference = (next: Renderer | null) => {
  preference = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const useRendererPreference = (): Renderer | null =>
  useSyncExternalStore(subscribe, () => preference);

const setRendererPreference = (renderer: Renderer): void => {
  try {
    localStorage.setItem(RENDERER_PREFERENCE_KEY, renderer);
  } catch {
    // See `read`.
  }
  setPreference(renderer);
};

const resetRendererPreference = (): void => setPreference(read());

export {
  RENDERER_PREFERENCE_KEY,
  resetRendererPreference,
  setRendererPreference,
  useRendererPreference,
};
