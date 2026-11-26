import { act } from "react";
import { onTestFinished } from "vitest";

const listeners = new Set<() => void>();
let matching = new Set<string>();
let stubbed = false;

/**
 * Makes exactly `queries` match, through a `window.matchMedia` stub (jsdom has
 * none) that is removed when the test finishes. Call it before rendering:
 * `useMediaQuery` subscribes on mount. Calling it again changes which queries
 * match and notifies listeners.
 */
const matchMediaQueries = (queries: string[]) => {
  matching = new Set(queries);
  if (stubbed) {
    act(() => listeners.forEach((listener) => listener()));
    return;
  }
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matching.has(query);
    },
    addEventListener: (_: string, listener: () => void) =>
      listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) =>
      listeners.delete(listener),
  })) as unknown as typeof window.matchMedia;
  stubbed = true;
  onTestFinished(() => {
    stubbed = false;
    listeners.clear();
    // @ts-expect-error lib.dom types matchMedia as required; jsdom has none to restore
    delete window.matchMedia;
  });
};

export default matchMediaQueries;
