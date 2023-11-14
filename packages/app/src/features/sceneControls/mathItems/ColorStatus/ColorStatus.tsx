import classNames from "classnames";
import {
  MathGraphic,
  makeColorConfig,
  colorsAndGradients,
} from "@math3d/mathitem-configs";
import React, { useCallback, useMemo } from "react";
import { useToggle } from "@/util/hooks";
import Popover, { rightStartEnd } from "@/util/components/Popover";
import { useLongAndShortPress } from "@/util/hooks/useLongAndShortPress";

import { positioning } from "@/util/styles";
import { useOnWidgetChange } from "../FieldWidget";
import { WidgetChangeEvent } from "../FieldWidget/types";
import { useMathScope } from "../mathItemsSlice";
import { useMathResults } from "../mathScope";
import ColorDialog from "./ColorDialog";
import styles from "./ColorStatus.module.css";

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText, "");
};

interface Props {
  item: MathGraphic;
}

const VISIBLE = ["visible"];

const popperModifiers = [rightStartEnd];
const ColorStatus: React.FC<Props> = (props) => {
  const { item } = props;
  const [dialogVisible, setDialogVisible] = useToggle(false);
  const { color } = item.properties;
  const mathScope = useMathScope();
  const results = useMathResults(mathScope, item.id, VISIBLE);
  const onChange = useOnWidgetChange(item);
  const visible = !!results.visible;
  const colorAndStyle = useMemo(() => getColor(color), [color]);
  const style = useMemo(
    () =>
      ({
        "--indicator-color": colorAndStyle.backgroundPreview,
      }) as React.CSSProperties,
    [colorAndStyle],
  );
  const { bind, lastPressWasLong } = useLongAndShortPress(setDialogVisible.on);

  const handleButtonClick = useCallback(() => {
    if (lastPressWasLong()) return;
    const event: WidgetChangeEvent = {
      name: "visible",
      value: `${!visible}`,
    };
    onChange(event);
  }, [visible, onChange, lastPressWasLong]);
  const handlePointerAway = useCallback(() => {
    if (lastPressWasLong()) return;
    setDialogVisible.off();
  }, [lastPressWasLong, setDialogVisible]);
  return (
    <Popover
      modifiers={popperModifiers}
      trigger={
        <button
          type="button"
          style={style}
          title="Color and Visibility"
          aria-label="Color and Visibility"
          className={classNames(
            styles.circle,
            positioning["absolute-centered"],
            {
              [styles.empty]: !visible,
            },
          )}
          onClick={handleButtonClick}
          {...bind()}
        />
      }
      visible={dialogVisible}
      onPointerAway={handlePointerAway}
    >
      <ColorDialog className={styles.dialog} item={item} />
    </Popover>
  );
};

export default ColorStatus;
