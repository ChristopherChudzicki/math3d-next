import classNames from "classnames";
import React, { useMemo, useState } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "@/util/components/MathLive";

import composeRefs from "../composeRefs";

const omit = <R extends Record<string, unknown>>(record: R, keys: string[]) => {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !keys.includes(key))
  );
};

const SmallMathField = React.forwardRef<MathfieldElement, MathfieldProps>(
  (props, forwardedRef) => {
    const { className, ...others } = props;
    const [mfEl, setMfEl] = useState<MathfieldElement | null>(null);
    const options: MathfieldProps["options"] = useMemo(() => {
      return {
        ...props.options,
        inlineShortcuts: {
          ...omit(mfEl?.inlineShortcuts ?? {}, ["fft", "int"]),
          pdiff: "\\frac{\\partial #?}{\\partial #?}",
          diff: "\\frac{\\differentialD #?}{\\differentialD #?}",
        },
      };
    }, [mfEl, props.options]);
    return (
      <MathField
        {...others}
        options={options}
        ref={composeRefs(setMfEl, forwardedRef)}
        className={classNames("small-math-field", className)}
      />
    );
  }
);
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
