import "./mathlive";

import { MathfieldElement, MathfieldOptions } from "mathlive";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import type { MathFieldWebComponentProps } from "./types";

export type MakeMathfieldOptions = (
  options: MathfieldOptions
) => Partial<MathfieldOptions>;

interface MathfieldProps extends MathFieldWebComponentProps {
  makeOptions?: MakeMathfieldOptions;
  children?: string;
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
    makeOptions,
    className,
    children,
    defaultValue,
    ...others
  } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);

  useEffect(() => {
    if (!mf) return;
    if (!makeOptions) return;
    const options = makeOptions(mf.getOptions());
    options.inlineShortcuts = {
      ...options.inlineShortcuts,
      diff: "\\operatorname{diff}",
    };
    mf.setOptions(options);
  }, [makeOptions, mf]);

  useEffect(() => {
    if (!mf) return;
    const mfValue = mf.getValue();
    if (mfValue !== children) {
      mf.setValue(children);
      /**
       * In an empty mathfield:
       *  1. Typing "[" results in LaTeX "\left\lbrack\right?"
       *  2. But in a controlled field, the cursor is put at end of line rather
       *     than in between the fences.
       * This attempts to account for that issue. *Likely there is a better way
       * to make a controlled field.*
       */
      if (children?.endsWith("?") && !mfValue.endsWith("?")) {
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
