import classNames from "classnames";
import React, { useCallback, useContext } from "react";
import { TextareaAutoWidthHeight } from "util/components";

import { MathContext } from "../mathScope";
import { IWidgetProps, WidgetChangeEvent } from "./types";
import styles from "./widget.module.css";

const EXTRA_WIDTH = 20;

const AutosizeText: React.FC<IWidgetProps> = (props: IWidgetProps) => {
  const mathScope = useContext(MathContext);
  const { onChange, name, title, error, itemId, style = {}, ...others } = props;
  const { width, height, ...styleWithoutSize } = style;
  const onInputChange: React.ChangeEventHandler<HTMLTextAreaElement> =
    useCallback(
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
    <TextareaAutoWidthHeight
      extraWidth={EXTRA_WIDTH}
      title={title}
      className={classNames(
        { [styles["has-error"]]: error },
        styles["field-widget"]
      )}
      name={name}
      onChange={onInputChange}
      style={styleWithoutSize}
      {...others}
    />
  );
};

export default AutosizeText;
