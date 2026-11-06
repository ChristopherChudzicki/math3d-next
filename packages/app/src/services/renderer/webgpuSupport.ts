import { useSyncExternalStore } from "react";

/** `failed`: an adapter was found, but Use.GPU couldn't start a device on it. */
type WebGpuSupport = "pending" | "available" | "unavailable" | "failed";

const DETECTION_TIMEOUT_MS = 2000;

const initialState = (): WebGpuSupport =>
  "gpu" in navigator ? "pending" : "unavailable";

let state = initialState();
let detecting = false;
// Bumped by resetWebGpuSupport, so a detection started before it can't settle.
let generation = 0;
const listeners = new Set<() => void>();

const setState = (next: WebGpuSupport) => {
  if (next === state) return;
  state = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const useWebGpuSupport = (): WebGpuSupport =>
  useSyncExternalStore(subscribe, () => state);

// Use.GPU requests its own adapter, so this one is discarded. `low-power`
// keeps the check off a discrete GPU.
const requestAdapter = async (): Promise<WebGpuSupport> => {
  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: "low-power",
    });
    return adapter ? "available" : "unavailable";
  } catch {
    return "unavailable";
  }
};

const startWebGpuDetection = (): void => {
  if (state !== "pending" || detecting) return;
  detecting = true;
  const started = generation;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<WebGpuSupport>((resolve) => {
    timer = setTimeout(() => resolve("unavailable"), DETECTION_TIMEOUT_MS);
  });
  Promise.race([requestAdapter(), timeout]).then((result) => {
    clearTimeout(timer);
    // A device failure reported meanwhile outranks a late adapter.
    if (started !== generation || state !== "pending") return;
    setState(result);
  });
};

/** Returns `true` only on the call that changed the state. */
const markWebGpuFailed = (): boolean => {
  if (state === "failed") return false;
  setState("failed");
  return true;
};

const resetWebGpuSupport = (): void => {
  generation += 1;
  detecting = false;
  setState(initialState());
};

export {
  markWebGpuFailed,
  resetWebGpuSupport,
  startWebGpuDetection,
  useWebGpuSupport,
};
export type { WebGpuSupport };
