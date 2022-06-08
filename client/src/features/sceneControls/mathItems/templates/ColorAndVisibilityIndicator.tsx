import React, { useMemo, useContext, useCallback } from "react";
import { colorsAndGradients, makeColorConfig } from "configs/colors";
import classNames from "classnames";
import { MathItem } from "configs";
import { MathContext, useMathResults } from "../mathScope";
import styles from "./ColorAndVisibilityIndicator.module.css";
import { useOnWidgetChange } from "../FieldWidget";
import { WidgetChangeEvent } from "../FieldWidget/types";

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText);
};

interface ItemWithColorAndVisible {
  properties: {
    color: string;
    visible: string;
  };
}

interface Props {
  item: MathItem & ItemWithColorAndVisible;
}

const VISIBLE = ["visible"];

const ColorAndVisibilityIndicator: React.FC<Props> = (props) => {
  const { item } = props;
  const { color } = item.properties;
  const mathScope = useContext(MathContext);
  const results = useMathResults(item.id, VISIBLE);
  const onChange = useOnWidgetChange(item);
  const visible = !!results.visible;
  const colorAndStyle = useMemo(() => getColor(color), [color]);
  const style = useMemo(
    () =>
      ({
        "--indicator-color": colorAndStyle.backgroundPreview,
      } as React.CSSProperties),
    [colorAndStyle]
  );
  const onClick = useCallback(() => {
    const event: WidgetChangeEvent = {
      name: "visible",
      mathScope,
      value: `${!visible}`,
    };
    onChange(event);
  }, [visible, onChange, mathScope]);
  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      aria-label="Color and Visibility"
      className={classNames(styles.circle, { [styles.empty]: !visible })}
    />
  );
};

export default ColorAndVisibilityIndicator;
export type { ItemWithColorAndVisible };
