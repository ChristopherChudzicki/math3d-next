import React, {
  forwardRef,
  useEffect,
  useState,
  RefObject,
  useImperativeHandle,
} from "react";
import { MathfieldElement, MathfieldOptions } from "mathlive";
import { useListenToEvent } from "./util";
import "./mathlive";
import type {
  FocusOutHandler,
  KeystrokeHandler,
  MathFieldWebComponentProps,
} from "./types";

export type MakeMathfieldOptions = (
  options: MathfieldOptions
) => Partial<MathfieldOptions>;

interface MathfieldProps extends MathFieldWebComponentProps {
  onKeystroke?: KeystrokeHandler;
  onFocusOut?: FocusOutHandler;
  makeOptions?: MakeMathfieldOptions;
  children?: string;
}

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
    ...others
  } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  useListenToEvent(mf, "keystroke", onKeystroke);
  useListenToEvent(mf, "focus-out", onFocusOut);
  useEffect(() => {
    if (!mf) return;
    if (!makeOptions) return;
    const options = makeOptions(mf.getOptions());
    mf.setOptions(options);
  }, [makeOptions, mf]);

  useEffect(() => {
    mf?.setValue(children);
  }, [mf, children]);

  useImperativeHandle(ref, () => mf);

  return (
    <math-field {...others} class={className} onInput={onChange} ref={setMf} />
  );
};

const MathField = forwardRef(MathFieldForwardRef);

export default MathField;
export type { MathfieldProps };
