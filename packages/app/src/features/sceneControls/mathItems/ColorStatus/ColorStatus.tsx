import classNames from "classnames";
import {
  MathGraphic,
  makeColorConfig,
  colorsAndGradients,
} from "@math3d/mathitem-configs";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useToggle } from "@/util/hooks";
import Popover, { rightStartEnd } from "@/util/components/Popover";
import { useLongAndShortPress } from "@/util/hooks/useLongAndShortPress";

import { positioning } from "@/util/styles";
import { useOnWidgetChange } from "../FieldWidget";
import { useMathScope } from "../sceneSlice";
import { useMathItemResults } from "../mathScope";
import ColorDialog from "./ColorDialog";
import styles from "./ColorStatus.module.css";

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText, "");
};

interface Props {
  item: MathGraphic;
}

const useEffectEcent = (cb: () => void, deps: unknown[]) => {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    cbRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const EVALUATED_PROPS = ["calculatedVisibility"] as const;

const popperModifiers = [rightStartEnd];
const ColorStatus: React.FC<Props> = (props) => {
  const { item } = props;
  const [dialogVisible, setDialogVisible] = useToggle(false);
  const { color, visible, useCalculatedVisibility } = item.properties;
  const mathScope = useMathScope();
  const { calculatedVisibility } = useMathItemResults(
    mathScope,
    item,
    EVALUATED_PROPS,
  );
  const finalVisibility = useCalculatedVisibility
    ? !!calculatedVisibility
    : visible;
  const onChange = useOnWidgetChange(item);
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
    onChange({
      name: "visible",
      value: !visible,
    });
    onChange({
      name: "useCalculatedVisibility",
      value: false,
    });
  }, [visible, onChange, lastPressWasLong]);
  useEffectEcent(() => {
    if (item.properties.calculatedVisibility !== "") {
      onChange({
        name: "useCalculatedVisibility",
        value: true,
      });
    }
  }, [calculatedVisibility, item.properties.calculatedVisibility]);

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
              [styles.empty]: !finalVisibility,
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
