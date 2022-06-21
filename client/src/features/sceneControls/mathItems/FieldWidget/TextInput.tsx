import classNames from "classnames";
import React, { useCallback } from "react";

import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

const TextInput: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, title, error, itemId, ...others } = props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const event: WidgetChangeEvent = {
        name,
        value: e.target.value,
      };
      onChange(event);
    },
    [onChange, name]
  );
  return (
    <input
      title={title}
      className={classNames(
        { [styles["has-error"]]: error },
        styles["field-widget"],
        styles["adjust-margin-for-border"]
      )}
      name={name}
      onChange={onInputChange}
      {...others}
    />
  );
};

export default TextInput;
