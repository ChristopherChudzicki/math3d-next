import classNames from "classnames";
import { getColorConfig } from "@math3d/mathitem-configs";
import type { MathGraphic } from "@math3d/mathitem-configs";
import React, { useCallback, useMemo, useState } from "react";
import { useToggle } from "@/util/hooks";
import { useLongAndShortClick } from "@/util/hooks/useLongAndShortClick";

import { positioning } from "@/util/styles";
import { Popover } from "@/ui/Popover";
import type { PopoverRootProps } from "@/ui/Popover";
import { Tooltip } from "@/ui/Tooltip";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useFinalVisibility } from "@/store/scene/evaluation/mathScope";
import ColorPopup from "./ColorPopup";
import styles from "./ColorStatus.module.css";

const TOOLTIP_DELAY = 800;

interface Props {
  item: MathGraphic;
}

const ColorStatus: React.FC<Props> = (props) => {
  const { item } = props;
  const [dialogVisible, setDialogVisible] = useToggle(false);
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null);
  const { color } = item.properties;
  const mathScope = useMathScope();
  const finalVisibility = useFinalVisibility(mathScope, item);
  const dispatch = useAppDispatch();
  const colorAndStyle = useMemo(() => getColorConfig(color), [color]);
  const style = useMemo(
    () =>
      ({
        "--indicator-color": colorAndStyle.backgroundPreview,
      }) as React.CSSProperties,
    [colorAndStyle],
  );

  const handleButtonClick = useCallback(() => {
    if (dialogVisible) {
      setDialogVisible.off();
      return;
    }
    dispatch(
      actions.setProperties({
        id: item.id,
        type: item.type,
        properties: {
          visible: !finalVisibility,
          useCalculatedVisibility: false,
        },
      }),
    );
  }, [dialogVisible, setDialogVisible, dispatch, item, finalVisibility]);
  const handleOpenChange: PopoverRootProps["onOpenChange"] = (
    open,
    eventDetails,
  ) => {
    // Leave a press on the dot to handleButtonClick, which closes the
    // popover instead of toggling visibility.
    if (
      eventDetails.reason === "outside-press" &&
      eventDetails.event.target instanceof Node &&
      buttonEl?.contains(eventDetails.event.target)
    ) {
      eventDetails.cancel();
      return;
    }
    setDialogVisible(open);
  };
  const longAndShortClick = useLongAndShortClick({
    onLongClick: setDialogVisible.on,
    onClick: handleButtonClick,
  });

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
        <Tooltip.Popup>Press and hold to change color</Tooltip.Popup>
      </Tooltip.Root>
      <Popover.Root
        open={dialogVisible}
        onOpenChange={handleOpenChange}
        modal="trap-focus"
      >
        <ColorPopup item={item} anchor={buttonEl} />
      </Popover.Root>
    </>
  );
};

export default ColorStatus;
