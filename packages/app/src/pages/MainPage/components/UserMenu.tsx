import React from "react";
import IconButton from "@/ui/IconButton";
import { Menu } from "@/ui/Menu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
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
          <MenuIcon fontSize="inherit" />
        </IconButton>
      }
    />
  ) : (
    <Menu.Trigger className={styles.avatar} aria-label="Open User Menu">
      <PersonIcon fontSize="inherit" />
      {/* Points up while the menu is open; see the CSS. */}
      <ArrowDropDownIcon fontSize="inherit" className={styles.arrow} />
    </Menu.Trigger>
  );

  return (
    <Menu.Root>
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
