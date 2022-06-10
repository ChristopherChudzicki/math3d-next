import React, { useMemo, useContext, useCallback, useRef } from "react";
import { colorsAndGradients, makeColorConfig } from "configs/colors";
import classNames from "classnames";
import { Popover } from "antd";
import { MathItem } from "configs";
import { useToggle } from "util/hooks";
import { useLongAndShortPress } from "util/hooks/useLongAndShortPress";
import { MathContext, useMathResults } from "../mathScope";
import styles from "./ColorAndVisibilityIndicator.module.css";
import { useOnWidgetChange } from "../FieldWidget";
import { WidgetChangeEvent } from "../FieldWidget/types";
import ColorDialog from "./ColorDialog";

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
  const [dialogVisible, setDialogVisible] = useToggle(false);
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
  const { bind: bindLongPress, lastPressWasLong } = useLongAndShortPress(
    setDialogVisible.on
  );

  const handleVisibleChange = useCallback(
    (value: boolean) => {
      if (value) return;
      if (lastPressWasLong()) return;
      setDialogVisible.off();
    },
    [setDialogVisible, lastPressWasLong]
  );
  const handleButtonClick = useCallback(() => {
    if (lastPressWasLong()) return;
    const event: WidgetChangeEvent = {
      name: "visible",
      mathScope,
      value: `${!visible}`,
    };
    onChange(event);
  }, [visible, onChange, mathScope, lastPressWasLong]);

  return (
    <Popover
      content={<ColorDialog />}
      trigger="click"
      visible={dialogVisible}
      onVisibleChange={handleVisibleChange}
    >
      <button
        type="button"
        style={style}
        aria-label="Color and Visibility"
        className={classNames(styles.circle, { [styles.empty]: !visible })}
        onClick={handleButtonClick}
        {...bindLongPress()}
      />
    </Popover>
  );
};

export default ColorAndVisibilityIndicator;
export type { ItemWithColorAndVisible };
