import classNames from "classnames";
import React, { useMemo, useState } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "@/util/components/MathLive";
import * as mfOptions from "@/util/components/MathLive/options";
import { composeRefs } from "..";

const SmallMathField: React.FC<
  MathfieldProps & { ref?: React.Ref<MathfieldElement> }
> = (props) => {
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  const { className, ref, ...others } = props;
  const options: MathfieldProps["options"] = useMemo(() => {
    if (!mf) return {};
    return {
      ...props.options,
      inlineShortcuts: mfOptions.inlineShortcuts,
      macros: {
        ...mf.macros,
        ...mfOptions.extraMacros,
      },
      menuItems: [],
    };
  }, [props.options, mf]);
  return (
    <MathField
      {...others}
      options={options}
      ref={composeRefs(ref, setMf)}
      className={classNames("small-math-field", className)}
    />
  );
};
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
