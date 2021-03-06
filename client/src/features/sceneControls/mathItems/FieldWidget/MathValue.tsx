import classNames from "classnames";
import React, { useCallback } from "react";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";

import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const MathValue: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { name, title, value, onChange, error, style, className } = props;

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
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      title={title}
      style={style}
      className={classNames(
        styles["field-widget"],
        styles["adjust-margin-for-border"],
        { [styles["has-error"]]: error },
        className
      )}
      onChange={handleChange}
      defaultValue={value}
    />
  );
};

export default MathValue;
