import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import SimpleMenu from "@/util/components/SimpleMenu/SimpleMenu";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import type { BadgeProps } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import type { AuthStatus } from "@/features/auth";
import styles from "./UserMenu.module.css";

const badgeAnchorOrigin: BadgeProps["anchorOrigin"] = {
  vertical: "bottom",
  horizontal: "right",
};

const UserMenu: React.FC<{
  items: SimpleMenuItem[];
  authStatus: AuthStatus;
  className?: string;
}> = ({ items, authStatus, className }) => {
  const [visible, setVisible] = useState(false);

  // A person avatar would tell a visitor with no account that they have one,
  // and on desktop it duplicates the header's own "Sign in" button; their menu
  // is mostly general navigation. The pending ["me"] query keeps the hamburger,
  // so the majority case — an anonymous visitor — never sees the icon change.
  const useHamburger = authStatus !== "authenticated";
  // The two triggers carry distinct accessible names: they open different
  // menus, and the name difference lets tests await the avatar specifically
  // rather than matching the hamburger shown while the ["me"] query resolves.
  const trigger = useHamburger ? (
    <IconButton aria-label="Open Menu" color="inherit">
      <MenuIcon />
    </IconButton>
  ) : (
    <Badge
      className={styles.badge}
      overlap="circular"
      anchorOrigin={badgeAnchorOrigin}
      badgeContent={visible ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
    >
      <Avatar
        className={styles.avatar}
        component="button"
        aria-label="Open User Menu"
      >
        <PersonIcon />
      </Avatar>
    </Badge>
  );

  return (
    <SimpleMenu
      onVisibilityChange={setVisible}
      items={items}
      aria-label={useHamburger ? "Menu" : "User Menu"}
      className={className}
      trigger={trigger}
    />
  );
};

export default UserMenu;
