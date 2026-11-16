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
import { Icon } from "@iconify/react/offline";
import type { IconifyIcon } from "@iconify/react/offline";
import circleAlert from "@iconify-icons/lucide/circle-alert";
import hand from "@iconify-icons/lucide/hand";
import link2 from "@iconify-icons/lucide/link-2";
import { useToggle } from "@/util/hooks";
import { useLongAndShortClick } from "@/util/hooks/useLongAndShortClick";

import { positioning } from "@/util/styles";
import { Popover } from "@/ui/Popover";
import type { PopoverRootProps } from "@/ui/Popover";
import { Tooltip } from "@/ui/Tooltip";
import { showNotice } from "@/ui/Toast/toasts";
import * as u from "@/util/styles/utils.module.css";
import { useAppDispatch, useAppStore } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useFinalVisibility,
  useMathErrors,
} from "@/store/scene/evaluation/mathScope";
import { visibilityMode } from "@/store/scene/state/util";
import ColorPopup from "./ColorPopup";
import styles from "./ColorStatus.module.css";

const TOOLTIP_DELAY = 800;
const CALCULATED_VISIBILITY = ["calculatedVisibility"] as const;

type Badge = { icon: IconifyIcon; text: string; className?: string };
const BADGES: Record<"following" | "manual" | "error", Badge> = {
  following: {
    icon: link2,
    text: "Shown or hidden by its Calculated Visibility.",
  },
  manual: {
    icon: hand,
    text: "Shown or hidden by hand. Calculated Visibility takes over when its value changes.",
  },
  error: {
    icon: circleAlert,
    text: "Its Calculated Visibility has an error, so it's shown.",
    className: styles["badge-error"],
  },
};

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
  const errors = useMathErrors(mathScope, item.id, CALCULATED_VISIBILITY);
  const mode = visibilityMode(item.properties);
  let badge: Badge | undefined;
  if (mode === "manual") badge = BADGES.manual;
  if (mode === "following") {
    badge = errors.calculatedVisibility ? BADGES.error : BADGES.following;
  }
  const badgeTextId = `${item.id}-visibility-mode`;
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const closeNotice = useRef<() => void>(undefined);
  useEffect(() => () => closeNotice.current?.(), []);
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
    const { loadCount } = store.getState().scene;
    const { description } = item.properties;
    closeNotice.current = showNotice({
      slot: "visibility-override",
      description: `“${description}” ${finalVisibility ? "hidden" : "shown"} by hand.`,
      anchor: buttonEl,
      action: {
        label: "Undo",
        onClick: () => {
          // Item ids recur across scenes; don't touch another scene's item.
          if (store.getState().scene.loadCount !== loadCount) return;
          dispatch(actions.followCalculatedVisibility({ ids: [item.id] }));
        },
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
    store,
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
    <>
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={TOOLTIP_DELAY}
          aria-describedby={badge ? badgeTextId : undefined}
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
            >
              {badge ? (
                <span className={classNames(styles.badge, badge.className)}>
                  <Icon icon={badge.icon} aria-hidden="true" />
                </span>
              ) : null}
            </button>
          }
        />
        <Tooltip.Popup>
          {badge ? <div>{badge.text}</div> : null}
          Press and hold to change color
        </Tooltip.Popup>
      </Tooltip.Root>
      {badge ? (
        <span id={badgeTextId} className={u.visuallyHidden}>
          {badge.text}
        </span>
      ) : null}
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
