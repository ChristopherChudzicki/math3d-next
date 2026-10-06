import React, { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react/offline";
import keyboard from "@iconify-icons/lucide/keyboard";
import chevronDown from "@iconify-icons/lucide/chevron-down";
import chevronUp from "@iconify-icons/lucide/chevron-up";
import { mathVirtualKeyboard, LAYOUTS } from "@/ui/MathLive/keyboards";
import { createPortal } from "react-dom";
import IconButton from "@/ui/IconButton";

import styles from "./KeyboardControls.module.css";

mathVirtualKeyboard.layouts = [LAYOUTS.numeric, LAYOUTS.functions, "greek"];

const showKeyboard = (event: FocusEvent) => {
  const { target } = event;
  if (!(target instanceof HTMLElement)) return;
  const mf = target.closest("math-field");
  if (mf) {
    mathVirtualKeyboard.show();
  }
};

const ToggleKeyboardButton = () => {
  const [autoExpand, setAutoExpand] = useState(false);
  const [mfEl, setMfEl] = useState<HTMLElement | null>(null);

  // Clean up the focusin listener on unmount.
  useEffect(() => {
    return () => document.removeEventListener("focusin", showKeyboard);
  }, []);

  const handleClick = useCallback(() => {
    const currentAutoExpand = !autoExpand;
    setAutoExpand(currentAutoExpand);
    // Attach/detach the focusin listener synchronously in the click handler
    // rather than in a useEffect. If done in an effect, the listener removal
    // is deferred until after render, creating a window where focusin events
    // (from focus shifts during the click) can re-show the keyboard.
    if (currentAutoExpand) {
      document.addEventListener("focusin", showKeyboard);
      if (mfEl) {
        mfEl.focus();
        mathVirtualKeyboard.show();
        setMfEl(null);
      } else {
        document.querySelector<HTMLElement>("math-field")?.focus();
        mathVirtualKeyboard.show();
      }
    } else {
      document.removeEventListener("focusin", showKeyboard);
      mathVirtualKeyboard.hide();
    }
  }, [autoExpand, mfEl]);
  return createPortal(
    <div className={styles.keyboardToggle} data-virtual-keyboard-control>
      <IconButton
        tabIndex={-1}
        onPointerDown={() => {
          if (document.activeElement?.tagName === "MATH-FIELD") {
            setMfEl(document.activeElement as HTMLElement);
          }
        }}
        // Keep focus in the math field, so popovers around it stay open.
        onMouseDown={(event) => event.preventDefault()}
        variant="solid"
        data-testid="toggle-keyboard-button"
        label="Enable math keyboard"
        onClick={handleClick}
        aria-pressed={autoExpand}
      >
        <Icon icon={keyboard} aria-hidden="true" />
        {autoExpand ? (
          <Icon icon={chevronDown} aria-hidden="true" />
        ) : (
          <Icon icon={chevronUp} aria-hidden="true" />
        )}
      </IconButton>
    </div>,
    document.body,
  );
};

export default ToggleKeyboardButton;
