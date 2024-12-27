import React, { useCallback, useMemo, useState } from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import { Link as RouterLink } from "react-router-dom";
import type { LinkProps as RouterLinkProps } from "react-router-dom";

type LinkBehaviorProps = Omit<RouterLinkProps, "to"> & {
  href: RouterLinkProps["to"];
  ref?: React.Ref<HTMLAnchorElement>;
};

/**
 * See https://mui.com/material-ui/guides/routing/#global-theme-link
 */
const LinkBehavior: React.FC<LinkBehaviorProps> = (props) => {
  const { href, ...other } = props;
  // Map href (Material UI) -> to (react-router)
  return <RouterLink to={href} {...other} />;
};

interface SimpleMenuItemBase {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  LinkComponent?: React.ElementType;
}

type SimpleMenuItemOnClick = SimpleMenuItemBase & {
  onClick: () => void;
  href?: string;
};

type SimpleMenuItemHref = SimpleMenuItemBase & {
  onClick?: () => void;
  href: string;
};

type SimpleMenuItem =
  | SimpleMenuItemOnClick
  | SimpleMenuItemHref
  | {
      element: React.ReactNode;
    };

type SimpleMenuProps = {
  items: SimpleMenuItem[];
  trigger: React.ReactElement<{
    onClick?: React.MouseEventHandler;
    ref?: React.Ref<HTMLElement>;
  }>;
  onVisibilityChange?: (visible: boolean) => void;
  className?: string;
  "aria-label"?: string;
};

/**
 * A wrapper around MUI's Menu that handles visibility, icons, placement
 * relative to trigger, and links as children.
 *
 * By default <SimpleMenu /> will render links using React Router's <Link />
 * component for SPA routing. For external links or links where a full reload
 * is desirable, an anchor tag is more appropriate. Use `LinkComponent: "a"`
 * in such cases.
 */
const SimpleMenu: React.FC<SimpleMenuProps> = ({
  items,
  trigger: _trigger,
  onVisibilityChange,
  className,
  "aria-label": ariaLabel,
}) => {
  const [open, _setOpen] = useState(false);
  const setOpen = useCallback(
    (newValue: boolean) => {
      _setOpen(newValue);
      if (newValue !== open) {
        onVisibilityChange?.(newValue);
      }
    },
    [open, onVisibilityChange],
  );

  const [el, setEl] = useState<HTMLElement | null>(null);

  const trigger = useMemo(() => {
    return React.cloneElement(_trigger, {
      onClick: (e: React.MouseEvent) => {
        setOpen(!open);
        _trigger.props.onClick?.(e);
      },
      ref: setEl,
    });
  }, [_trigger, setOpen, open]);

  return (
    <>
      {trigger}
      <Menu
        className={className}
        open={open}
        MenuListProps={{
          "aria-label": ariaLabel,
          className,
        }}
        anchorEl={el}
        onClose={() => setOpen(false)}
      >
        {items.map((item) => {
          if ("element" in item) {
            return item.element;
          }
          const linkProps = item.href
            ? {
                /**
                 * Used to render the MenuItem as a react router link (or
                 * specified link component) instead of a <li>.
                 *
                 * This is technically invalid HTML: The child of a <ul> should
                 * be a <li>. However, this seems to be the most accessible way
                 * to render a link inside MUI's <Menu /> components.
                 *
                 * See:
                 *  - https://github.com/mui/material-ui/issues/33268
                 *  - https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-links/
                 *    shows a more correct implementation.
                 */
                component: item.LinkComponent ?? LinkBehavior,
                href: item.href,
              }
            : {};
          const onClick = () => {
            item.onClick?.();
            setOpen(false);
          };
          return (
            <MenuItem {...linkProps} key={item.key} onClick={onClick}>
              {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}
              {item.label}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default SimpleMenu;
export type { SimpleMenuProps, SimpleMenuItem };
