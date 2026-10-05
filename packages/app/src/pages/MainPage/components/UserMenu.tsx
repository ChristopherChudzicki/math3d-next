import React from "react";
import IconButton from "@/ui/IconButton";
import { Menu } from "@/ui/Menu";
import { Icon } from "@iconify/react/offline";
import chevronDown from "@iconify-icons/lucide/chevron-down";
import menuIcon from "@iconify-icons/lucide/menu";
import user from "@iconify-icons/lucide/user";
import type { AuthStatus } from "@/features/auth";
import styles from "./UserMenu.module.css";

const UserMenu: React.FC<{
  authStatus: AuthStatus;
  /** Shown at the top of the menu, labelling its items. */
  email?: string;
  children: React.ReactNode;
}> = ({ authStatus, email, children }) => {
  // A person avatar would tell a visitor with no account that they have one,
  // and on desktop it duplicates the header's own "Sign in" button; their menu
  // is mostly general navigation. The pending ["me"] query keeps the hamburger,
  // so the majority case — an anonymous visitor — never sees the icon change.
  const useHamburger = authStatus !== "authenticated";
  // The two triggers carry distinct accessible names: they open different
  // menus, and the name difference lets tests await the avatar specifically
  // rather than matching the hamburger shown while the ["me"] query resolves.
  // The menu takes its name from the trigger.
  const trigger = useHamburger ? (
    <Menu.Trigger
      render={
        <IconButton label="Open Menu">
          <Icon icon={menuIcon} aria-hidden="true" />
        </IconButton>
      }
    />
  ) : (
    <Menu.Trigger className={styles.avatar} aria-label="Open User Menu">
      <Icon icon={user} aria-hidden="true" />
      {/* Points up while the menu is open; see the CSS. */}
      <Icon icon={chevronDown} aria-hidden="true" className={styles.arrow} />
    </Menu.Trigger>
  );

  return (
    // Keyed so the menu closes when the trigger swaps (the ["me"] query
    // settling while the hamburger's menu is open); otherwise it stays open,
    // anchored to a button that is no longer on the page.
    <Menu.Root key={useHamburger ? "hamburger" : "avatar"}>
      {trigger}
      <Menu.Popup>
        {email ? (
          <Menu.Group>
            <Menu.GroupLabel data-testid="username-display">
              {email}
            </Menu.GroupLabel>
            {children}
          </Menu.Group>
        ) : (
          children
        )}
      </Menu.Popup>
    </Menu.Root>
  );
};

export default UserMenu;
