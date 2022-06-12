import React, { useMemo, useContext, useCallback } from "react";
import { colorsAndGradients, makeColorConfig } from "configs/colors";
import classNames from "classnames";
import { Popover } from "antd";
import { MathGraphic } from "configs";
import { useToggle } from "util/hooks";
import { useLongAndShortPress } from "util/hooks/useLongAndShortPress";
import { MathContext, useMathResults } from "../mathScope";
import styles from "./ColorStatus.module.css";
import { useOnWidgetChange } from "../FieldWidget";
import { WidgetChangeEvent } from "../FieldWidget/types";
import ColorDialog from "./ColorDialog";

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText);
};

interface Props {
  item: MathGraphic;
}

const VISIBLE = ["visible"];

const ColorStatus: React.FC<Props> = (props) => {
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
  const { bind, lastPressWasLong } = useLongAndShortPress(setDialogVisible.on);

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
      content={<ColorDialog item={item} />}
      trigger="click"
      placement="right"
      visible={dialogVisible}
      onVisibleChange={handleVisibleChange}
    >
      <button
        type="button"
        style={style}
        title="Color and Visibility"
        aria-label="Color and Visibility"
        className={classNames(styles.circle, { [styles.empty]: !visible })}
        onClick={handleButtonClick}
        {...bind()}
      />
    </Popover>
  );
};

export default ColorStatus;
