import classNames from "classnames";
import {
  MathGraphic,
  makeColorConfig,
  colorsAndGradients,
} from "@math3d/mathitem-configs";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useToggle } from "@/util/hooks";
import { useLongAndShortClick } from "@/util/hooks/useLongAndShortClick";

import { positioning } from "@/util/styles";
import { Popover } from "@/ui/Popover";
import { Tooltip } from "@/ui/Tooltip";
import { useOnWidgetChange } from "../FieldWidget";
import { useMathScope } from "../sceneSlice";
import { useMathItemResults } from "../mathScope";
import ColorDialog from "./ColorDialog";
import styles from "./ColorStatus.module.css";

const TOOLTIP_DELAY = 800;

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText, "");
};

interface Props {
  item: MathGraphic;
}

const useEffectEvent = (cb: () => void, deps: unknown[]) => {
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

const ColorStatus: React.FC<Props> = (props) => {
  const { item } = props;
  const [dialogVisible, setDialogVisible] = useToggle(false);
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null);
  const { color, visible, useCalculatedVisibility } = item.properties;
  const mathScope = useMathScope();
  const [calcVisInit, setCalcVisInit] = useToggle(false);
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

  const handleButtonClick = useCallback(() => {
    onChange({ name: "visible", value: !visible });
    onChange({ name: "useCalculatedVisibility", value: false });
  }, [visible, onChange]);
  const longAndShortClick = useLongAndShortClick({
    onLongClick: setDialogVisible.on,
    onClick: handleButtonClick,
  });

  useEffect(() => {
    if (calculatedVisibility && !calcVisInit) {
      setCalcVisInit.on();
    }
  }, [calculatedVisibility, calcVisInit, setCalcVisInit]);
  useEffectEvent(() => {
    if (!calcVisInit) return;
    if (item.properties.calculatedVisibility !== "") {
      onChange({
        name: "useCalculatedVisibility",
        value: true,
      });
    }
  }, [calculatedVisibility, item.properties.calculatedVisibility]);

  return (
    <>
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={TOOLTIP_DELAY}
          render={
            <button
              type="button"
              style={style}
              ref={setButtonEl}
              aria-pressed={finalVisibility}
              aria-label="Show Graphic"
              className={classNames(
                styles.circle,
                positioning["absolute-centered"],
                {
                  [styles.empty]: !finalVisibility,
                },
              )}
              {...longAndShortClick.handlers}
            />
          }
        />
        <Tooltip.Popup>Long press to change color</Tooltip.Popup>
      </Tooltip.Root>
      <Popover.Root open={dialogVisible} onOpenChange={setDialogVisible.set}>
        <Popover.Popup
          anchor={buttonEl}
          side="right"
          aria-label="Color"
          data-dndkit-no-drag
        >
          <ColorDialog className={styles.dialog} item={item} />
        </Popover.Popup>
      </Popover.Root>
    </>
  );
};

export default ColorStatus;
