import type { MathfieldElement } from "mathlive";

export interface MathfieldHTMLAttributes
  extends Omit<React.HTMLAttributes<MathfieldElement>, "onInput"> {
  onChange?: React.ChangeEventHandler<MathfieldElement> | undefined;
  /**
   * MathLive dispatches its `input` event on the `<math-field>` element itself,
   * so `event.target` is the `MathfieldElement` (not just an `EventTarget`).
   * `@types/react` >= 19.2 retyped the DOM `onInput` attribute to a dedicated
   * `InputEventHandler` whose `target` is a bare `EventTarget`, which is both
   * less accurate here and incompatible with the `onChange` (ChangeEventHandler)
   * we bind to it. Model `onInput` as a `ChangeEventHandler` to match runtime.
   */
  onInput?: React.ChangeEventHandler<MathfieldElement> | undefined;
}

export type MathFieldWebComponentProps = React.DetailedHTMLProps<
  MathfieldHTMLAttributes,
  MathfieldElement
>;

declare module "react" {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface IntrinsicElements {
      "math-field": Omit<MathFieldWebComponentProps, "className" | "style"> & {
        class?: MathFieldWebComponentProps["className"];
      };
    }
  }
}
