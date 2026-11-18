import classNames from "classnames";
import React, { useMemo, useState } from "react";
import composeRefs from "@/util/composeRefs";
import { MathField, MathfieldElement, MathfieldProps } from "./MathLive";
import * as mfOptions from "./MathLive/options";

// MathField reassigns an option whenever its value's identity changes, and
// assigning macros re-parses the field, so each option value stays stable.
const NO_MENU_ITEMS: MathfieldElement["menuItems"] = [];

const SmallMathField: React.FC<
  MathfieldProps & { ref?: React.Ref<MathfieldElement> }
> = (props) => {
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  const { className, ref, ...others } = props;
  const macros = useMemo(
    () => mf && { ...mf.macros, ...mfOptions.extraMacros },
    [mf],
  );
  const options: MathfieldProps["options"] = macros
    ? {
        ...props.options,
        inlineShortcuts: mfOptions.inlineShortcuts,
        macros,
        menuItems: NO_MENU_ITEMS,
      }
    : undefined;
  // A new ref callback each render would detach and reattach the ref,
  // setting `mf` twice per render.
  const composedRef = useMemo(() => composeRefs(ref, setMf), [ref]);
  return (
    <MathField
      {...others}
      options={options}
      ref={composedRef}
      className={classNames("small-math-field", className)}
    />
  );
};
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
