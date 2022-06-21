import { FocusOutEvent, KeystrokeEvent, MathfieldElement } from "mathlive";

export type KeystrokeHandler = (
  this: MathfieldElement,
  ev: CustomEvent<KeystrokeEvent>
) => void;

export type FocusOutHandler = (
  this: MathfieldElement,
  ev: CustomEvent<FocusOutEvent>
) => void;

export type MathfieldEventName = "keystroke" | "focus-out";

export type MathfieldHandlers = {
  keystroke: KeystrokeHandler;
  "focus-out": FocusOutHandler;
};

export interface MathfieldHTMLAttributes
  extends React.HTMLAttributes<MathfieldElement> {
  onChange?: React.ChangeEventHandler<MathfieldElement> | undefined;
}

export type MathFieldWebComponentProps = React.DetailedHTMLProps<
  MathfieldHTMLAttributes,
  MathfieldElement
>;

declare global {
  /** @internal */
  namespace JSX {
    interface IntrinsicElements {
      "math-field": Omit<MathFieldWebComponentProps, "className" | "style"> & {
        class: MathFieldWebComponentProps["className"];
      };
    }
  }
}
