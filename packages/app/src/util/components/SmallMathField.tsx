import classNames from "classnames";
import React, { useMemo } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "@/util/components/MathLive";
import * as mfOptions from "@/util/components/MathLive/options";

const SmallMathField = React.forwardRef<MathfieldElement, MathfieldProps>(
  (props, forwardedRef) => {
    const { className, ...others } = props;
    const options: MathfieldProps["options"] = useMemo(() => {
      return {
        ...props.options,
        inlineShortcuts: mfOptions.inlineShortcuts,
      };
    }, [props.options]);
    return (
      <MathField
        {...others}
        options={options}
        ref={forwardedRef}
        className={classNames("small-math-field", className)}
      />
    );
  }
);
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
