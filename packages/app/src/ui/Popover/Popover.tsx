import React from "react";
import classNames from "classnames";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { isVirtualKeyboardTarget } from "../MathLive/virtualKeyboard";
import * as styles from "./Popover.module.css";

const { Trigger, Close, Title, Description } = BasePopover;

type RootProps = BasePopover.Root.Props;

/** Whether a dismissal came from using MathLive's virtual keyboard. */
const isVirtualKeyboardDismissal = ({
  reason,
  event,
}: BasePopover.Root.ChangeEventDetails) => {
  if (reason === "outside-press") return isVirtualKeyboardTarget(event.target);
  if (reason === "focus-out" && event instanceof FocusEvent) {
    return isVirtualKeyboardTarget(event.relatedTarget);
  }
  return false;
};

/**
 * Groups the popover's parts. Non-modal by default: the page stays usable,
 * and a press outside the popover, or tabbing out of it, closes it.
 *
 * Using MathLive's virtual keyboard doesn't count as leaving the popover, so
 * a math field inside it can be typed into with the keyboard.
 */
const Root: React.FC<RootProps> = ({ onOpenChange, ...others }) => (
  <BasePopover.Root
    {...others}
    onOpenChange={(open, eventDetails) => {
      if (isVirtualKeyboardDismissal(eventDetails)) {
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

export { Root, Trigger, Popup, Close, Title, Description };
export type { RootProps, PopupProps };
