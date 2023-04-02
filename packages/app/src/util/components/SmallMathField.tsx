import classNames from "classnames";
import type { MathfieldOptions } from "mathlive";
import React, { useCallback, useState } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "@/util/components/MathLive";

import { useShadowStylesheet } from "../hooks";
import composeRefs from "../composeRefs";

/**
 * Custom overrides for math-live's MathField Web Component.
 * Danger! This relies on internal math-live classnames
 */
const styleOverrides = /* css */ `
:host(.small-math-field) .ML__container {
  min-height: auto;
}

:host(.small-math-field) .ML__content {
  padding: 1px;
}
`;

const makeOptionsDefault: MathfieldProps["makeOptions"] = (opts) => ({
  keypressSound: null,
  plonkSound: null,
  inlineShortcuts: {
    ...opts.inlineShortcuts,
    pdiff: "\\frac{\\partial #?}{\\partial #?}",
    diff: "\\frac{\\differentialD #?}{\\differentialD #?}",
    fft: undefined,
    in: undefined,
  },
});

const SmallMathField = React.forwardRef<MathfieldElement, MathfieldProps>(
  (props, forwardedRef) => {
    const { className, makeOptions, ...others } = props;
    const [mfEl, setMfEl] = useState<MathfieldElement | null>(null);
    useShadowStylesheet(mfEl, styleOverrides);
    const mergedMakeOptions = useCallback(
      (options: MathfieldOptions) => {
        const overrides = makeOptions ? makeOptions(options) : {};
        const defaults = makeOptionsDefault(options);
        return { ...defaults, ...overrides };
      },
      [makeOptions]
    );
    return (
      <MathField
        makeOptions={mergedMakeOptions}
        {...others}
        ref={composeRefs(setMfEl, forwardedRef)}
        className={classNames("small-math-field", className)}
      />
    );
  }
);
SmallMathField.displayName = "SmallMathField";

export default SmallMathField;
