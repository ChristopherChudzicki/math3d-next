import "./mathlive";

import type { Keybinding, MathfieldElement } from "mathlive";
import React, { useEffect, useMemo, useRef, useState } from "react";

import composeRefs from "@/util/composeRefs";
import type { MathFieldWebComponentProps } from "./types";

type MathfieldPropsOptions = Pick<
  MathfieldElement,
  "inlineShortcuts" | "macros" | "readOnly" | "menuItems" | "placeholder"
>;
interface MathfieldProps extends MathFieldWebComponentProps {
  value?: string;
  options?: Partial<MathfieldPropsOptions>;
}

type OnMathFieldChange = NonNullable<MathfieldProps["onChange"]>;

/**
 * MathLive's Escape switches math and text mode to raw-LaTeX mode, stranding
 * later typing. Without the binding, Escape does nothing, as in a text input.
 */
const withoutEscapeToLatex = (keybindings: readonly Keybinding[]) =>
  keybindings.filter((kb) => !(kb.key === "[Escape]" && kb.ifMode !== "latex"));

/**
 * A React component for MathLive's MathField.
 *
 * Note: Following React's convention, `props.onChange` is bound to the `input`
 * event. See https://reactjs.org/docs/dom-elements.html#onchange
 */
const MathField = (props: MathfieldProps) => {
  const {
    onKeyDown,
    onChange,
    className,
    value,
    defaultValue,
    options,
    ref,
    ...others
  } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  const appliedRef = useRef<Partial<MathfieldPropsOptions>>({});

  useEffect(() => {
    if (!mf) return undefined;
    const apply = () => {
      mf.keybindings = withoutEscapeToLatex(mf.keybindings);
    };
    apply();
    // MathLive resets keybindings when the element is moved in the DOM.
    mf.addEventListener("mount", apply);
    return () => mf.removeEventListener("mount", apply);
  }, [mf]);

  useEffect(() => {
    if (!mf || !options) return undefined;
    const apply = () => {
      const applied = appliedRef.current;
      (Object.keys(options) as (keyof MathfieldPropsOptions)[]).forEach(
        (key) => {
          // Assigning macros re-parses the field, which turns the provisional
          // ")" of a just-typed "(" into a permanent one.
          if (options[key] === applied[key]) return;
          // @ts-expect-error keys, values not correlated well.
          mf[key] = options[key];
          // @ts-expect-error keys, values not correlated well.
          applied[key] = options[key];
        },
      );
    };
    apply();
    // MathLive resets these options when the element is moved in the DOM
    // (e.g., a keyed reorder), firing "mount" once it has reconnected.
    const reapply = () => {
      appliedRef.current = {};
      apply();
    };
    mf.addEventListener("mount", reapply);
    return () => mf.removeEventListener("mount", reapply);
  }, [mf, options]);

  useEffect(() => {
    if (!mf) return;
    const mfValue = mf.getValue();
    if (mfValue !== value) {
      mf.setValue(value);
      /**
       * In an empty mathfield:
       *  1. Typing "[" results in LaTeX "\left\lbrack\right?"
       *  2. But in a controlled field, the cursor is put at end of line rather
       *     than in between the fences.
       * This attempts to account for that issue. *Likely there is a better way
       * to make a controlled field.*
       */
      if (value?.endsWith("?") && !mfValue.endsWith("?")) {
        mf.executeCommand("moveToPreviousWord");
      }
    }
  });

  // A new ref callback each render would detach and reattach the ref,
  // setting `mf` twice per render.
  const composedRef = useMemo(() => composeRefs(ref, setMf), [ref]);
  return (
    <math-field
      {...others}
      class={className}
      onInput={onChange}
      ref={composedRef}
    />
  );
};

export default MathField;
export type { MathfieldProps, OnMathFieldChange };
