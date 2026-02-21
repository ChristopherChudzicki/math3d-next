import React, { useState } from "react";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import type { User } from "@math3d/api";
import SimpleMenu from "@/util/components/SimpleMenu/SimpleMenu";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import type { BadgeProps } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import { DISPLAY_AUTH_FLOWS } from "@/features/auth";
import styles from "./UserMenu.module.css";

const badgeAnchorOrigin: BadgeProps["anchorOrigin"] = {
  vertical: "bottom",
  horizontal: "right",
};

const UserIcon = ({ user }: { user?: User | null }) => {
  if (!user) return <PersonIcon />;
  return user.public_nickname[0].toUpperCase() || <PersonIcon />;
};

const UserMenu: React.FC<{
  items: SimpleMenuItem[];
  user?: User | null;
  className?: string;
}> = ({ items, user, className }) => {
  const [visible, setVisible] = useState(false);

  const useHamburger = !DISPLAY_AUTH_FLOWS && !user;
  const trigger = useHamburger ? (
    <IconButton aria-label="Open User Menu" color="inherit">
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
        <UserIcon user={user} />
      </Avatar>
    </Badge>
  );

  return (
    <SimpleMenu
      onVisibilityChange={setVisible}
      items={items}
      aria-label="User Menu"
      className={className}
      trigger={trigger}
    />
  );
};

export default UserMenu;
