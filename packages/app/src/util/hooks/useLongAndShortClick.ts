import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  LongPressCallback,
  LongPressReactEvents,
  LongPressOptions,
  LongPressEventType,
  useLongPress,
  LongPressPointerHandlers,
} from "use-long-press";

const DEFAULT_OPTS: Required<Pick<LongPressOptions, "threshold">> = {
  threshold: 400,
};

type LongAndShortClickProps<T extends Element = Element> = {
  onLongClick: (ev: LongPressReactEvents<T> | React.KeyboardEvent<T>) => void;
  onClick?: (ev: React.MouseEvent<T>) => void;
  threshold?: number;
};
type LongAndShortClickResult<T extends Element> = {
  handlers: LongPressPointerHandlers<T> & {
    onKeyDown: (event: React.KeyboardEvent<T>) => void;
    onClick: (event: React.MouseEvent<T>) => void;
  };
};

/**
 * Ignores the rest of a held key's press: its repeats and its release.
 * Otherwise they reach whatever a long press moved focus to (Enter activates
 * buttons on keydown, Space on keyup).
 */
const swallowRestOfPress = (key: string) => {
  const listening = new AbortController();
  const swallow = (event: KeyboardEvent) => {
    if (event.key !== key) return;
    // A fresh press means the release was missed (e.g. focus left the page).
    if (event.type === "keydown" && !event.repeat) {
      listening.abort();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "keyup") listening.abort();
  };
  const options = { capture: true, signal: listening.signal };
  window.addEventListener("keydown", swallow, options);
  window.addEventListener("keyup", swallow, options);
  window.addEventListener("blur", () => listening.abort(), {
    signal: listening.signal,
  });
};

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
export const useLongAndShortClick = <T extends Element = Element>(
  props: LongAndShortClickProps<T>,
): LongAndShortClickResult<T> => {
  const { threshold, onLongClick, onClick } = useMemo(
    () => ({ ...DEFAULT_OPTS, ...props }),
    [props],
  );
  const wasLongPressedRef = useRef(false);
  const handleLongPress: LongPressCallback<T, unknown> = useCallback(
    (event) => {
      wasLongPressedRef.current = true;
      onLongClick(event);
    },
    [onLongClick],
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

  const pointerBind = useLongPress<T>(handleLongPress, {
    threshold,
    detect: LongPressEventType.Pointer,
  });

  const handlers: LongAndShortClickResult<T>["handlers"] = useMemo(() => {
    let keyboardDownAt: number | null = null;
    let handlerCalled = false;
    return {
      ...pointerBind(),
      onKeyDown: (event: React.KeyboardEvent<T>) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        if (!event.repeat) {
          wasLongPressedRef.current = false;
        }
        if (event.key === "Enter") {
          /**
           * Normally:
           *  1. spacebar down+up triggers a click event
           *  2. enter down triggers click events continuously
           *
           * Behavior (2) is problematic because we only want click to fire if
           * the event is NOT longpress, and we cant tell that w/o the keyboard
           * event.
           */
          event.preventDefault();
        }
        if (!event.repeat) {
          handlerCalled = false;
          keyboardDownAt = new Date().getTime();
        } else if (
          keyboardDownAt &&
          !handlerCalled &&
          new Date().getTime() - keyboardDownAt > threshold
        ) {
          onLongClick(event);
          wasLongPressedRef.current = true;
          handlerCalled = true;
          swallowRestOfPress(event.key);
        }
      },
      onKeyUp: (event: React.KeyboardEvent<T>) => {
        if (
          (event.key === "Enter" || event.key === " ") &&
          keyboardDownAt &&
          !handlerCalled &&
          new Date().getTime() - (keyboardDownAt as number) > threshold
        ) {
          onLongClick(event);
          wasLongPressedRef.current = true;
          handlerCalled = true;
        }
        if (
          event.key === "Enter" &&
          new Date().getTime() - (keyboardDownAt as number) < threshold &&
          event.target instanceof HTMLElement
        ) {
          event.target.click();
        }
      },
      onClick: (event: React.MouseEvent<T>) => {
        if (wasLongPressedRef.current) {
          event.stopPropagation();
        } else {
          onClick?.(event);
        }
      },
    };
  }, [pointerBind, onClick, onLongClick, threshold]);

  return { handlers };
};

export type { LongAndShortClickProps, LongAndShortClickResult };
