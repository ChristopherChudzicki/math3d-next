import React, { useCallback, useContext, useState } from "react";
import classNames from "classnames";
import {
  MathField,
  MathfieldProps,
  MathfieldElement,
  OnMathFieldChange,
} from "util/components/MathLive";
import { useShadowStylesheet } from "util/hooks";
import { MathContext } from "../mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

/**
 * Custom overrides for math-live's MathField Web Component.
 */
const styleOverrides = /* css */ `
:host(.math-value) .ML__fieldcontainer {
  min-height: auto;
}`;

const makeOptions: MathfieldProps["makeOptions"] = () => ({
  keypressSound: null,
  plonkSound: null,
});

const MathEqualityInput: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { name, title, value, onChange, error, style, className } = props;
  const [mf, setMf] = useState<MathfieldElement | null>(null);
  const mathScope = useContext(MathContext);
  useShadowStylesheet(mf, styleOverrides);

  const handleChange: OnMathFieldChange = useCallback(
    (e) => {
      const widgetChangeEvent = {
        name,
        value: e.target.value,
        mathScope,
      };
      onChange(widgetChangeEvent);
    },
    [name, mathScope, onChange]
  );

  return (
    <MathField
      ref={setMf}
      makeOptions={makeOptions}
      title={title}
      style={style}
      className={classNames(
        styles["math-font"],
        "math-value",
        {
          [styles["has-error"]]: error,
        },
        className
      )}
      onChange={handleChange}
    >
      {value}
    </MathField>
  );
};

export default MathEqualityInput;
