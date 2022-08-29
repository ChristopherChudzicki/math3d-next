import "./mathlive";

import { MathfieldElement, MathfieldOptions } from "mathlive";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import type {
  FocusOutHandler,
  KeystrokeHandler,
  MathFieldWebComponentProps,
} from "./types";
import { useListenToEvent } from "./util";

export type MakeMathfieldOptions = (
  options: MathfieldOptions
) => Partial<MathfieldOptions>;

interface MathfieldProps extends MathFieldWebComponentProps {
  onKeystroke?: KeystrokeHandler;
  onFocusOut?: FocusOutHandler;
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
    onKeystroke,
    onFocusOut,
    onChange,
    makeOptions,
    className,
    children,
    defaultValue,
    ...others
  } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  useListenToEvent(mf, "keystroke", () => {});
  useListenToEvent(mf, "focus-out", onFocusOut);
  useEffect(() => {
    if (!mf) return;
    if (!makeOptions) return;
    const options = makeOptions(mf.getOptions());
    mf.setOptions(options);
  }, [makeOptions, mf]);

  useEffect(() => {
    if (!mf) return;
    if (mf.getValue() !== children) {
      mf.setValue(children);
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
