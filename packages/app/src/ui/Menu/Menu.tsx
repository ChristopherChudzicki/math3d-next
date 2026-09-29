import React from "react";
import classNames from "classnames";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import * as styles from "./Menu.module.css";

const { Root, Trigger, Group } = BaseMenu;

type PopupProps = Omit<BaseMenu.Popup.Props, "className"> &
  Pick<
    BaseMenu.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset"
  > & {
    className?: string;
  };

/** The menu surface, with its portal and positioner. */
const Popup: React.FC<PopupProps> = ({
  side = "bottom",
  align = "end",
  sideOffset = 6,
  alignOffset,
  className,
  ...others
}) => (
  <BaseMenu.Portal>
    <BaseMenu.Positioner
      className={styles.positioner}
      side={side}
      align={align}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
    >
      <BaseMenu.Popup
        {...others}
        className={classNames(styles.popup, className)}
      />
    </BaseMenu.Positioner>
  </BaseMenu.Portal>
);

type ItemContentProps = {
  /** Decorative icon, shown before the label. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
};

const ItemContent: React.FC<ItemContentProps> = ({ icon, children }) => (
  <>
    {icon ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : null}
    <span className={styles.label}>{children}</span>
  </>
);

type ItemProps = Omit<BaseMenu.Item.Props, "className" | "children"> &
  ItemContentProps & {
    tone?: "neutral" | "danger";
    className?: string;
  };

const Item: React.FC<ItemProps> = ({
  icon,
  tone = "neutral",
  className,
  children,
  ...others
}) => (
  <BaseMenu.Item
    {...others}
    className={classNames(styles.item, styles[tone], className)}
  >
    <ItemContent icon={icon}>{children}</ItemContent>
  </BaseMenu.Item>
);

type LinkItemProps = Omit<BaseMenu.LinkItem.Props, "className" | "children"> &
  ItemContentProps & {
    className?: string;
  };

/**
 * A menu item that navigates. For client-side routing, pass the router's
 * link as `render`, e.g. `render={<Link to="/examples" />}`. Closes the menu
 * on click (Base UI's default is to stay open), since a client-side
 * navigation leaves the menu mounted.
 */
const LinkItem: React.FC<LinkItemProps> = ({
  icon,
  closeOnClick = true,
  className,
  children,
  ...others
}) => (
  <BaseMenu.LinkItem
    {...others}
    closeOnClick={closeOnClick}
    className={classNames(styles.item, styles.neutral, className)}
  >
    <ItemContent icon={icon}>{children}</ItemContent>
  </BaseMenu.LinkItem>
);

type SeparatorProps = Omit<BaseMenu.Separator.Props, "className"> & {
  className?: string;
};

const Separator: React.FC<SeparatorProps> = ({ className, ...others }) => (
  <BaseMenu.Separator
    {...others}
    className={classNames(styles.separator, className)}
  />
);

type GroupLabelProps = Omit<BaseMenu.GroupLabel.Props, "className"> & {
  className?: string;
};

const GroupLabel: React.FC<GroupLabelProps> = ({ className, ...others }) => (
  <BaseMenu.GroupLabel
    {...others}
    className={classNames(styles.groupLabel, className)}
  />
);

export { Root, Trigger, Popup, Item, LinkItem, Separator, Group, GroupLabel };
export type { PopupProps, ItemProps, LinkItemProps };
