import React, {
  createContext,
  useContext,
  useId,
  useMemo,
  useState,
} from "react";
import classNames from "classnames";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import * as styles from "./Tooltip.module.css";

type TooltipContextValue = { popupId: string; open: boolean };
const TooltipContext = createContext<TooltipContextValue | null>(null);

const useTooltipContext = () => {
  const context = useContext(TooltipContext);
  if (!context) throw new Error("Tooltip parts must be inside Tooltip.Root");
  return context;
};

type RootProps = BaseTooltip.Root.Props;

/**
 * Groups the tooltip's parts. Always controlled, so `Trigger` knows when to
 * point `aria-describedby` at the popup.
 */
const Root: React.FC<RootProps> = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  ...others
}) => {
  const popupId = useId();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;
  const context = useMemo(() => ({ popupId, open }), [popupId, open]);
  return (
    <TooltipContext.Provider value={context}>
      <BaseTooltip.Root
        {...others}
        open={open}
        onOpenChange={(nextOpen, eventDetails) => {
          onOpenChange?.(nextOpen, eventDetails);
          if (!eventDetails.isCanceled) setUncontrolledOpen(nextOpen);
        }}
      />
    </TooltipContext.Provider>
  );
};

type TriggerProps = BaseTooltip.Trigger.Props;

/**
 * The element the tooltip describes; pass it as `render`. While the tooltip
 * is open, its text is the trigger's accessible description.
 */
const Trigger: React.FC<TriggerProps> = ({ delay = 100, ...others }) => {
  const { popupId, open } = useTooltipContext();
  const describedBy = [others["aria-describedby"], open && popupId]
    .filter(Boolean)
    .join(" ");
  return (
    <BaseTooltip.Trigger
      {...others}
      delay={delay}
      aria-describedby={describedBy || undefined}
    />
  );
};

type PopupProps = Omit<BaseTooltip.Popup.Props, "className"> &
  Pick<
    BaseTooltip.Positioner.Props,
    "anchor" | "side" | "align" | "sideOffset"
  > & {
    className?: string;
  };

/**
 * The tooltip bubble, with its portal, positioner, and arrow. Positioned
 * against the trigger, or against `anchor` for a tooltip without one; pass
 * `id` to describe that anchor by hand.
 */
const Popup: React.FC<PopupProps> = ({
  anchor,
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
  children,
  ...others
}) => {
  const { popupId } = useTooltipContext();
  return (
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner
        className={styles.positioner}
        anchor={anchor}
        side={side}
        align={align}
        sideOffset={sideOffset}
      >
        <BaseTooltip.Popup
          id={popupId}
          role="tooltip"
          {...others}
          className={classNames(styles.popup, className)}
        >
          <BaseTooltip.Arrow className={styles.arrow} />
          {children}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
};

export { Root, Trigger, Popup };
export type { RootProps, TriggerProps, PopupProps };
