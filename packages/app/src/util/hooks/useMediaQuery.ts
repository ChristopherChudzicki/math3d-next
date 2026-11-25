import { useCallback, useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches, updating as it changes. False where
 * `matchMedia` doesn't exist (jsdom).
 */
const useMediaQuery = (query: string): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
  );
};

export default useMediaQuery;
