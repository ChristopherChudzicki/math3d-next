import classNames from "classnames";
import React, { useCallback } from "react";

import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

const TextInput: React.FC<
  IWidgetProps & { ref?: React.Ref<HTMLInputElement> }
> = (props) => {
  const { onChange, className, name, label, error, itemId, ref, ...others } =
    props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const event: WidgetChangeEvent<string> = {
        name,
        value: e.target.value,
      };
      onChange(event);
    },
    [onChange, name],
  );
  return (
    <input
      ref={ref}
      aria-label={label}
      className={classNames(
        { [styles["has-error"]]: error },
        styles["field-widget-input"],
        className,
      )}
      name={name}
      onChange={onInputChange}
      {...others}
    />
  );
};

export default TextInput;
