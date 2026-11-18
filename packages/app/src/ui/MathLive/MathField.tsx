import "./mathlive";

import type { MathfieldElement } from "mathlive";
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
  const defaultsRef = useRef<NonNullable<MathfieldProps["options"]>>({});
  const appliedRef = useRef<NonNullable<MathfieldProps["options"]>>({});

  useEffect(() => {
    if (!mf) return;
    const defaults = defaultsRef.current;
    const applied = appliedRef.current;
    const keys = new Set([
      ...Object.keys(applied),
      ...Object.keys(options ?? {}),
    ]) as Set<keyof MathfieldPropsOptions>;
    keys.forEach((key) => {
      const next = options?.[key];
      // Assigning some options (e.g., macros) re-parses the field's content,
      // which drops in-progress edits like an auto-inserted closing paren.
      if (next === applied[key]) return;
      if (!(key in defaults)) {
        // @ts-expect-error keys, values not correlated well.
        defaults[key] = mf[key];
      }
      // @ts-expect-error keys, values not correlated well.
      mf[key] = next ?? defaults[key];
      if (next === undefined) {
        delete applied[key];
      } else {
        // @ts-expect-error keys, values not correlated well.
        applied[key] = next;
      }
    });
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
