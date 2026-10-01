import React, { useCallback, useEffect, useState } from "react";
import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { mathVirtualKeyboard, LAYOUTS } from "@/ui/MathLive/keyboards";
import { createPortal } from "react-dom";
import Button from "@/ui/Button";

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
    <div className={styles.keyboardToggle}>
      <Button
        tabIndex={-1}
        onPointerDown={() => {
          if (document.activeElement?.tagName === "MATH-FIELD") {
            setMfEl(document.activeElement as HTMLElement);
          }
        }}
        className={styles.keyboardToggleButton}
        variant="solid"
        data-testid="toggle-keyboard-button"
        aria-label="Enable math keyboard"
        onClick={handleClick}
        aria-pressed={autoExpand}
      >
        <KeyboardAltOutlinedIcon fontSize="inherit" />
        {autoExpand ? (
          <KeyboardArrowDownIcon fontSize="inherit" />
        ) : (
          <KeyboardArrowUpIcon fontSize="inherit" />
        )}
      </Button>
    </div>,
    document.body,
  );
};

export default ToggleKeyboardButton;
