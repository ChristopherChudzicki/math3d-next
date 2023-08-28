import React, { useCallback, useEffect, useState } from "react";
import KeyboardAltOutlinedIcon from "@mui/icons-material/KeyboardAltOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  mathVirtualKeyboard,
  LAYOUTS,
} from "@/util/components/MathLive/keyboards";
import { createPortal } from "react-dom";
import Button from "@mui/material/Button";

import styles from "./KeyboardControls.module.css";

mathVirtualKeyboard.layouts = [LAYOUTS.numeric];

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
  useEffect(() => {
    if (autoExpand) {
      document.addEventListener("focusin", showKeyboard);
      return () => document.removeEventListener("focusin", showKeyboard);
    }
    return () => null;
  }, [autoExpand]);

  const handleClick = useCallback(() => {
    const currentAutoExpand = !autoExpand;
    setAutoExpand(currentAutoExpand);
    if (currentAutoExpand) {
      if (mfEl) {
        mfEl.focus();
        mathVirtualKeyboard.show();
        setMfEl(null);
      } else {
        document.querySelector<HTMLElement>("math-field")?.focus();
        mathVirtualKeyboard.show();
      }
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
        color="secondary"
        variant="contained"
        disableElevation
        onClick={handleClick}
      >
        <KeyboardAltOutlinedIcon />
        {autoExpand ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />}
      </Button>
    </div>,
    document.body
  );
};

export default ToggleKeyboardButton;
