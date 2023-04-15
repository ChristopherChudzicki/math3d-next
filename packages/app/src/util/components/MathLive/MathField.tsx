import "./mathlive";

import type { MathfieldElement } from "mathlive";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { MathFieldWebComponentProps } from "./types";

type MathfieldPropsOptions = Pick<
  MathfieldElement,
  "inlineShortcuts" | "readOnly"
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
const MathFieldForwardRef = (
  props: MathfieldProps,
  ref: React.Ref<MathfieldElement | null>
) => {
  const {
    onKeyDown,
    onChange,
    className,
    value,
    defaultValue,
    options,
    ...others
  } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  const mfOptsRef = useRef<NonNullable<MathfieldProps["options"]>>({});

  useEffect(() => {
    if (!mf) return;
    const keys = new Set([
      ...Object.keys(mfOptsRef.current),
      ...Object.keys(options ?? {}),
    ]) as Set<keyof MathfieldPropsOptions>;
    keys.forEach((key) => {
      if (!mfOptsRef.current[key]) {
        mfOptsRef.current[key] = mf[key];
      }
      if (options?.[key]) {
        mf[key] = options[key];
      } else {
        mf[key] = mfOptsRef.current[key];
        delete mfOptsRef.current[key];
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

  useImperativeHandle(ref, () => mf);

  return (
    <math-field {...others} class={className} onInput={onChange} ref={setMf} />
  );
};

const MathField = forwardRef(MathFieldForwardRef);

export default MathField;
export type { MathfieldProps, OnMathFieldChange };
