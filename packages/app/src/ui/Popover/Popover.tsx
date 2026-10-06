import React from "react";
import classNames from "classnames";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { isVirtualKeyboardTarget } from "../MathLive/virtualKeyboard";
import * as styles from "./Popover.module.css";

const { Trigger, Close, Description } = BasePopover;

type RootProps = BasePopover.Root.Props;

/**
 * Groups the popover's parts. Presses on MathLive's virtual keyboard don't
 * count as outside the popover, so its math fields can be typed into with it.
 */
const Root: React.FC<RootProps> = ({ onOpenChange, ...others }) => (
  <BasePopover.Root
    {...others}
    onOpenChange={(open, eventDetails) => {
      if (
        eventDetails.reason === "outside-press" &&
        isVirtualKeyboardTarget(eventDetails.event.target)
      ) {
        eventDetails.cancel();
        return;
      }
      onOpenChange?.(open, eventDetails);
    }}
  />
);

type PopupProps = Omit<BasePopover.Popup.Props, "className"> &
  Pick<
    BasePopover.Positioner.Props,
    "anchor" | "side" | "align" | "sideOffset" | "alignOffset"
  > & {
    className?: string;
  };

/**
 * The popover surface, with its portal and positioner. Positioned against the
 * trigger, or against `anchor` for a popover opened some other way.
 */
const Popup: React.FC<PopupProps> = ({
  anchor,
  side = "bottom",
  align = "center",
  sideOffset = 6,
  alignOffset,
  className,
  ...others
}) => (
  <BasePopover.Portal>
    <BasePopover.Positioner
      className={styles.positioner}
      anchor={anchor}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
    >
      <BasePopover.Popup
        {...others}
        className={classNames(styles.popup, className)}
      />
    </BasePopover.Positioner>
  </BasePopover.Portal>
);

type TitleProps = Omit<BasePopover.Title.Props, "className"> & {
  className?: string;
};

const Title: React.FC<TitleProps> = ({ className, ...others }) => (
  <BasePopover.Title
    {...others}
    className={classNames(styles.title, className)}
  />
);

export { Root, Trigger, Popup, Close, Title, Description };
export type { RootProps, PopupProps, TitleProps };
