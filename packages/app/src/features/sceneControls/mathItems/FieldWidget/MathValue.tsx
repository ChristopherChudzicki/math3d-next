import classNames from "classnames";
import React, { useCallback } from "react";
import type {
  OnMathFieldChange,
  MathfieldElement,
} from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";

import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const MathValue = React.forwardRef<MathfieldElement, IWidgetProps>(
  (props, ref) => {
    const {
      name,
      label,
      value,
      onChange,
      error,
      style,
      className,
      itemId,
      ...others
    } = props;

    const handleChange: OnMathFieldChange = useCallback(
      (e) => {
        const widgetChangeEvent = {
          name,
          value: e.target.value,
        };
        onChange(widgetChangeEvent);
      },
      [name, onChange]
    );

    return (
      <SmallMathField
        {...others}
        ref={ref}
        aria-label={label}
        style={style}
        className={classNames(
          styles["field-widget-input"],
          { [styles["has-error"]]: error },
          className
        )}
        aria-invalid={error ? "true" : "false"}
        onChange={handleChange}
        value={value}
      />
    );
  }
);
MathValue.displayName = "MathValue";

export default MathValue;
