import classNames from "classnames";
import type { MathfieldOptions } from "mathlive";
import React, { useCallback, useMemo, useState } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "@/util/components/MathLive";

import { useShadowStylesheet } from "../hooks";
import composeRefs from "../composeRefs";

const omit = <R extends Record<string, unknown>>(record: R, keys: string[]) => {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !keys.includes(key))
  );
};

/**
 * Custom overrides for math-live's MathField Web Component.
 * Danger! This relies on internal math-live classnames
 */
const styleOverrides = /* css */ `
:host(.small-math-field) .ML__content {
  padding: 1px;
}
`;

const SmallMathField = React.forwardRef<MathfieldElement, MathfieldProps>(
  (props, forwardedRef) => {
    const { className, ...others } = props;
    const [mfEl, setMfEl] = useState<MathfieldElement | null>(null);
    useShadowStylesheet(mfEl, styleOverrides);
    const inlineShortcuts: MathfieldElement["inlineShortcuts"] = useMemo(() => {
      return {
        ...omit(mfEl?.inlineShortcuts ?? {}, ["fft", "int"]),
        pdiff: "\\frac{\\partial #?}{\\partial #?}",
        diff: "\\frac{\\differentialD #?}{\\differentialD #?}",
      };
    }, [mfEl]);
    return (
      <MathField
        {...others}
        inlineShortcuts={inlineShortcuts}
        ref={composeRefs(setMfEl, forwardedRef)}
        className={classNames("small-math-field", className)}
      />
    );
  }
);
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
