import classNames from "classnames";
import React, { useCallback } from "react";
import { TextareaAutoWidthHeight } from "util/components";

import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

const EXTRA_WIDTH = 20;

const AutosizeText: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const { onChange, name, title, error, itemId, style = {}, ...others } = props;
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
      [onChange, name]
    );
  return (
    <TextareaAutoWidthHeight
      onBlur={props.onBlur}
      onFocus={props.onFocus}
      extraWidth={EXTRA_WIDTH}
      title={title}
      className={classNames(
        { [styles["has-error"]]: error },
        styles["field-widget"],
        styles["adjust-margin-for-border"]
      )}
      name={name}
      onChange={onInputChange}
      style={styleWithoutSize}
      {...others}
    />
  );
};

export default AutosizeText;
