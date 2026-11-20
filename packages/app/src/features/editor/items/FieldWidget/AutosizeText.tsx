import classNames from "classnames";
import React, { useCallback } from "react";

import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

/** Sized to its text by CSS `field-sizing: content`; wraps at its `max-width`. */
const AutosizeText: React.FC<
  IWidgetProps & {
    ref?: React.Ref<HTMLTextAreaElement>;
  }
> = (props) => {
  const { onChange, name, label, error, itemId, className, ref, ...others } =
    props;
  const onInputChange: React.ChangeEventHandler<HTMLTextAreaElement> =
    useCallback(
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
    <textarea
      {...others}
      ref={ref}
      // Browsers without field-sizing show one line and scroll the rest.
      rows={1}
      aria-label={label}
      className={classNames(
        { [styles["has-error"]]: error },
        styles["field-widget-input"],
        className,
      )}
      name={name}
      onChange={onInputChange}
    />
  );
};

export default AutosizeText;
