import classNames from "classnames";
import { getColorConfig } from "@math3d/mathitem-configs";
import type { MathGraphic } from "@math3d/mathitem-configs";
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
import type { PopoverRootProps } from "@/ui/Popover";
import { Tooltip } from "@/ui/Tooltip";
import { showNotice } from "@/ui/Toast/toasts";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useFinalVisibility } from "@/store/scene/evaluation/mathScope";
import VisibilityBadge from "@/features/editor/items/visibility/VisibilityBadge";
import { visibilityMode } from "@/store/scene/state/util";
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
  const mode = visibilityMode(item.properties);
  const dispatch = useAppDispatch();
  const loadCount = useAppSelector((state) => state.scene.loadCount);
  const closeNotice = useRef<() => void>(undefined);
  // Rows outlive a scene switch (ids recur), so a new scene closes it too.
  useEffect(() => () => closeNotice.current?.(), [loadCount]);
  // Once the item isn't manual, there's nothing left to undo.
  useEffect(() => {
    if (mode !== "manual") closeNotice.current?.();
  }, [mode]);
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
    closeNotice.current?.();
    // Flip what's shown, not `visible`, which the expression may be overriding.
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
    if (mode !== "following" || !buttonEl) return;
    const name = item.properties.description.trim();
    const what = name ? `“${name}”` : "Graphic";
    closeNotice.current = showNotice({
      description: `${what} ${finalVisibility ? "hidden" : "shown"} by hand.`,
      anchor: buttonEl,
      action: {
        label: "Undo",
        onClick: () =>
          dispatch(actions.followCalculatedVisibility({ ids: [item.id] })),
      },
    });
  }, [
    dialogVisible,
    setDialogVisible,
    dispatch,
    item,
    finalVisibility,
    mode,
    buttonEl,
  ]);
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
    <span className={classNames(styles.dot, positioning["absolute-centered"])}>
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
              className={classNames(styles.circle, {
                [styles.empty]: !finalVisibility,
              })}
              {...longAndShortClick.handlers}
            />
          }
        />
        <Tooltip.Popup>Press and hold to change color</Tooltip.Popup>
      </Tooltip.Root>
      <VisibilityBadge item={item} />
      <Popover.Root
        open={dialogVisible}
        onOpenChange={handleOpenChange}
        modal="trap-focus"
      >
        <ColorPopup item={item} anchor={buttonEl} />
      </Popover.Root>
    </span>
  );
};

export default ColorStatus;
