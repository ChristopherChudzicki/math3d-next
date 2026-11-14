import { onTestFinished, vi } from "vitest";
import type { LoaderMessage } from "@/features/viewport/three/loader/messages";

/** Sets `target[key]` for the current test, then restores or removes it. */
const stubProperty = (target: object, key: string, value: unknown) => {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { value, configurable: true });
  onTestFinished(() => {
    if (original) Object.defineProperty(target, key, original);
    else Reflect.deleteProperty(target, key);
  });
};

/**
 * Lets the loading knot start in JSDOM, which has neither `Worker` nor
 * `OffscreenCanvas`, for the current test. Returns what the knot posts to its
 * worker, and the worker's `terminate`.
 */
export const stubKnotLoaderSupport = () => {
  const posted: LoaderMessage[] = [];
  const terminate = vi.fn();
  const worker = {
    postMessage: (message: LoaderMessage) => posted.push(message),
    addEventListener: () => {},
    terminate,
  };
  // vi.stubGlobal is avoided: vi.unstubAllGlobals() would also undo the test
  // setup's stubs. A function, not an arrow, so the knot can call it with new.
  stubProperty(globalThis, "Worker", function FakeWorker() {
    return worker;
  });
  stubProperty(
    HTMLCanvasElement.prototype,
    "transferControlToOffscreen",
    () => ({}),
  );
  return { posted, terminate };
};
