import { useEffect, useRef } from "react";
import type { RefObject } from "react";

type PinchHandlers = {
  /** Two fingers are down: a pinch starts, or restarts with a new pair. */
  start(): void;
  /** The pair's distance at `start` over its current distance. */
  move(ratio: number): void;
};

/**
 * Two-finger touch pinches on `host`, reported while `enabled`. From the
 * second finger until every finger lifts, later fingers' `pointerdown`s and
 * all touch moves are kept from the canvas: Use.GPU's DOM events track one
 * pointer position, so its orbit controls would read two fingers as a
 * jittery rotate.
 */
export const usePinchZoom = (
  host: RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: PinchHandlers,
) => {
  const latest = useRef({ enabled, handlers });
  useEffect(() => {
    latest.current = { enabled, handlers };
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const touches = new Map<number, [number, number]>();
    let startDistance = 0;
    let swallowing = false;
    const distance = () => {
      const [[x1, y1], [x2, y2]] = touches.values();
      return Math.hypot(x2 - x1, y2 - y1);
    };
    const restartIfPair = () => {
      startDistance = touches.size === 2 ? distance() : 0;
      if (startDistance > 0 && latest.current.enabled) {
        latest.current.handlers.start();
      }
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      // A new first finger: drop any touch whose lift never reached `host`.
      if (e.isPrimary) {
        touches.clear();
        swallowing = false;
      }
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (touches.size < 2) return;
      swallowing = true;
      e.stopPropagation();
      restartIfPair();
    };
    const move = (e: PointerEvent) => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      if (!swallowing) return;
      e.stopPropagation();
      const d = startDistance > 0 ? distance() : 0;
      if (d > 0 && latest.current.enabled) {
        latest.current.handlers.move(startDistance / d);
      }
    };
    const up = (e: PointerEvent) => {
      if (!touches.delete(e.pointerId)) return;
      if (touches.size === 0) swallowing = false;
      restartIfPair();
    };
    // Capture phase on the host runs before the canvas's own listeners, so
    // stopping an event keeps it from the canvas.
    const options = { capture: true };
    el.addEventListener("pointerdown", down, options);
    el.addEventListener("pointermove", move, options);
    el.addEventListener("pointerup", up, options);
    el.addEventListener("pointercancel", up, options);
    return () => {
      el.removeEventListener("pointerdown", down, options);
      el.removeEventListener("pointermove", move, options);
      el.removeEventListener("pointerup", up, options);
      el.removeEventListener("pointercancel", up, options);
    };
  }, [host]);
};
