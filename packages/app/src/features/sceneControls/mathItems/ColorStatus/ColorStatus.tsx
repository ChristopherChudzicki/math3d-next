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
import Popover from "@mui/material/Popover";
import { useLongAndShortClick } from "@/util/hooks/useLongAndShortClick";

import { positioning } from "@/util/styles";
import Tooltip from "@mui/material/Tooltip";
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

  const handleCLose = useCallback(() => {
    setDialogVisible.off();
  }, [setDialogVisible]);
  return (
    <>
      <Tooltip
        title="Long press to change color"
        enterDelay={TOOLTIP_DELAY}
        enterNextDelay={TOOLTIP_DELAY}
        describeChild
      >
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
      </Tooltip>
      <Popover
        open={dialogVisible}
        anchorEl={buttonEl}
        onClose={handleCLose}
        anchorOrigin={{
          vertical: "center",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            // @ts-expect-error https://github.com/mui/material-ui/issues/33175
            "data-dndkit-no-drag": true,
          },
        }}
      >
        <ColorDialog className={styles.dialog} item={item} />
      </Popover>
    </>
  );
};

export default ColorStatus;
