import { useCallback, useEffect, useRef } from "react";
import {
  LongPressCallback,
  LongPressOptions,
  LongPressResult,
  LongPressHandlers,
  useLongPress,
} from "use-long-press";

/**
 * A wrapper around [use-long-press](https://github.com/minwork/use-long-press)
 * to help distinguish when a press is short. (I.e., a click.)
 *
 * `use-long-press` is great, but with its default usage `onClick` handlers will
 * fire for both short and long presses.
 *
 * This hook facilitates setting up onClick handlers that fire only for short
 * presses (the usual user click behavior).
 *
 * The hook returns the longPress context and a `lastPressWasLong` function.
 */
export const useLongAndShortPress = <T extends Element = Element>(
  longPressCb: LongPressCallback<T>,
  options?: LongPressOptions<T>,
): {
  bind: LongPressResult<LongPressHandlers<T>, unknown>;
  lastPressWasLong: () => boolean;
} => {
  const wasLongPressedRef = useRef(false);
  const handleLongPress: LongPressCallback<T, unknown> = useCallback(
    (event, meta) => {
      wasLongPressedRef.current = true;
      longPressCb(event, meta);
    },
    [longPressCb],
  );

  useEffect(() => {
    const onPointerDown = () => {
      wasLongPressedRef.current = false;
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  const lastPressWasLong = useCallback(() => {
    return wasLongPressedRef.current;
  }, []);
  const bind = useLongPress(handleLongPress, options);
  return { bind, lastPressWasLong };
};
