import classNames from "classnames";
import React, { useCallback } from "react";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";

import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const MathValue: React.FC<IWidgetProps> = (props: IWidgetProps) => {
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
      aria-label={label}
      style={style}
      className={classNames(
        styles["field-widget-input"],
        { [styles["has-error"]]: error },
        className
      )}
      onChange={handleChange}
      defaultValue={value}
      {...others}
    />
  );
};

export default MathValue;
