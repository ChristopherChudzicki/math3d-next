import classNames from "classnames";
import React, { useCallback } from "react";
import { TextareaAutoWidthHeight } from "@/util/components";

import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

const EXTRA_WIDTH = 20;

const AutosizeText = React.forwardRef<HTMLTextAreaElement, IWidgetProps>(
  (props, ref) => {
    const {
      onChange,
      name,
      label,
      error,
      itemId,
      style = {},
      className,
      ...others
    } = props;
    const { width, height, ...styleWithoutSize } = style;
    const onInputChange: React.ChangeEventHandler<HTMLTextAreaElement> =
      useCallback(
        (e) => {
          const event: WidgetChangeEvent = {
            name,
            value: e.target.value,
          };
          onChange(event);
        },
        [onChange, name],
      );
    return (
      <TextareaAutoWidthHeight
        {...others}
        extraWidth={EXTRA_WIDTH}
        aria-label={label}
        className={classNames(
          { [styles["has-error"]]: error },
          styles["field-widget-input"],
          className,
        )}
        name={name}
        onChange={onInputChange}
        style={styleWithoutSize}
        ref={ref}
      />
    );
  },
);
AutosizeText.displayName = "AutosizeText";

export default AutosizeText;
