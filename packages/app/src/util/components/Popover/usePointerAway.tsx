import { RefObject, useCallback, useEffect, useRef } from "react";

/**
 * This is similar to a [`useClickAway`](https://github.com/streamich/react-use/blob/master/docs/useClickAway.md)
 * hook. qThe difference is that instead of listening for click events outside
 * of a container element, it listens for pointerdown+pointerup combos outside
 * the container. In particular, the `onPointerAway` handler will be called when
 *  - a `pointerdown` event occurs outside the container element, AND
 *  - the next `pointerup` is also outside the container element.
 *
 * The reason we are using this instead of `useClickAway` is that MathLive does
 * not currently support click events on text within MathField elements.
 * See https://github.com/streamich/react-use/blob/master/docs/useClickAway.md
 *
 */
const usePointerAway = (
  containerRef: RefObject<HTMLElement | undefined>,
  onPointerAway: () => void,
) => {
  const downRef = useRef<HTMLElement>(undefined);

  const onPointerDown = useCallback((event: PointerEvent) => {
    if (event.target instanceof HTMLElement) {
      downRef.current = event.target;
    } else {
      downRef.current = undefined;
    }
  }, []);
  const onPointerUp = useCallback(
    (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      if (!onPointerAway) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (!downRef.current) return;
      const upEl = event.target;
      const downEl = downRef.current;
      if (container.contains(downEl) || container.contains(upEl)) return;
      onPointerAway();
    },
    [onPointerAway, containerRef],
  );
  useEffect(() => {
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPointerDown, onPointerUp]);
};

export default usePointerAway;
