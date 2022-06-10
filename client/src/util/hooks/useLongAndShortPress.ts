import { useCallback, useMemo, useRef } from "react";
import {
  useLongPress,
  LongPressCallback,
  LongPressOptions,
  LongPressResult,
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
export const useLongAndShortPress = <T = Element>(
  longPressCb: LongPressCallback<T>,
  options?: LongPressOptions<T>
): {
  bind: (context?: unknown) => LongPressResult<T>;
  lastPressWasLong: () => boolean;
} => {
  const wasLongPressedRef = useRef(false);
  const handleLongPress: LongPressCallback<T, unknown> = useCallback(
    (event, meta) => {
      wasLongPressedRef.current = true;
      longPressCb(event, meta);
    },
    [longPressCb]
  );
  const onCancel: LongPressCallback<T> = useCallback(
    (event, meta) => {
      wasLongPressedRef.current = false;
      if (options?.onCancel) {
        options.onCancel(event, meta);
      }
    },
    [options]
  );
  const patchedOptions = useMemo(() => {
    return { ...(options ?? {}), onCancel };
  }, [onCancel, options]);
  const lastPressWasLong = useCallback(() => {
    return wasLongPressedRef.current;
  }, []);
  const bind = useLongPress(handleLongPress, patchedOptions);
  return { bind, lastPressWasLong };
};
