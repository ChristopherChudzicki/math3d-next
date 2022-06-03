import React, { useCallback, useContext } from "react";
import classNames from "classnames";
import { IWidgetProps, WidgetChangeEvent } from "./types";
import { MathContext } from "../mathScope";
import styles from "./widget.module.css";

/**
 * Mock widget. Good as placeholder and for integration tests since Jest does
 * not support enough ShadowDOM functionality for MathLive to work.
 */
const MockWidget: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const mathScope = useContext(MathContext);
  const { onChange, name, title, error, ...others } = props;
  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const event: WidgetChangeEvent = {
        name,
        value: e.target.value,
        mathScope,
      };
      onChange(event);
    },
    [onChange, name, mathScope]
  );
  return (
    <input
      title={title}
      className={classNames({
        [styles["has-error"]]: error,
      })}
      name={name}
      onChange={onInputChange}
      {...others}
    />
  );
};

export default MockWidget;
