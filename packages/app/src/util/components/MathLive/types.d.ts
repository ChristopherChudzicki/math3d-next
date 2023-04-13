import type { MathfieldElement } from "mathlive";

export interface MathfieldHTMLAttributes
  extends React.HTMLAttributes<MathfieldElement>,
    Partial<MathfieldElement> {
  onChange?: React.ChangeEventHandler<MathfieldElement> | undefined;
}

export type MathFieldWebComponentProps = React.DetailedHTMLProps<
  MathfieldHTMLAttributes,
  MathfieldElement
>;

declare global {
  /** @internal */
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface IntrinsicElements {
      "math-field": Omit<MathFieldWebComponentProps, "className" | "style"> & {
        class: MathFieldWebComponentProps["className"];
      };
    }
  }
}
