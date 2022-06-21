import classNames from "classnames";
import React, { useCallback, useContext } from "react";
import { OnMathFieldChange } from "util/components/MathLive";
import SmallMathField from "util/components/SmallMathField";

import { MathContext } from "../mathScope";
import { IWidgetProps } from "./types";
import styles from "./widget.module.css";

const MathValue: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { name, title, value, onChange, error, style, className } = props;
  const mathScope = useContext(MathContext);

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
    <SmallMathField
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
