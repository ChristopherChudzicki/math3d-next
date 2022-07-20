import classNames from "classnames";
import { MathfieldOptions } from "mathlive";
import React, { useCallback, useRef } from "react";
import {
  MathField,
  MathfieldElement,
  MathfieldProps,
} from "util/components/MathLive";

import { useShadowStylesheet } from "../hooks";

/**
 * Custom overrides for math-live's MathField Web Component.
 * Danger! This relies on internal math-live classnames
 */
const styleOverrides = /* css */ `
:host(.small-math-field) .ML__container {
  min-height: auto;
}`;

const makeOptionsDefault: MathfieldProps["makeOptions"] = () => ({
  keypressSound: null,
  plonkSound: null,
});

const SmallMathField: React.FC<MathfieldProps> = (props: MathfieldProps) => {
  const { className, makeOptions, ...others } = props;
  const ref = useRef<MathfieldElement>(null);
  useShadowStylesheet(ref.current, styleOverrides);
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
      ref={ref}
      className={classNames("small-math-field", className)}
    />
  );
};

export default SmallMathField;
