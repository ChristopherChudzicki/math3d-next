import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";

import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuthStatus } from "@/features/auth";
import Button from "@mui/material/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useToggle } from "@/util/hooks";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import { useUserMe } from "@math3d/api";
import styles from "./Header.module.css";
import UserMenu from "./UserMenu";

const LoginButtons: React.FC<{
  smallScreen: boolean;
  isAuthenticated: boolean;
}> = ({ smallScreen, isAuthenticated }) => {
  if (isAuthenticated) return null;
  if (smallScreen) {
    return (
      <>
        <MenuItem to="auth/login" component={Link}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign in</ListItemText>
        </MenuItem>
        <MenuItem to="auth/register" component={Link}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign up</ListItemText>
        </MenuItem>
      </>
    );
  }
  return (
    <>
      <Button
        variant="text"
        color="secondary"
        component={Link}
        to="auth/register"
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign up
      </Button>
      <Button
        variant="text"
        color="secondary"
        component={Link}
        to="auth/login"
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign in
      </Button>
    </>
  );
};

type FilterableItem = SimpleMenuItem & {
  shouldShow?: ({
    smallScreen,
    isAuthenticated,
  }: {
    smallScreen: boolean;
    isAuthenticated: boolean;
  }) => boolean;
};
const items: FilterableItem[] = [
  {
    key: "signin",
    label: "Sign in",
    icon: <AccountCircleOutlinedIcon fontSize="small" />,
    href: "auth/login",
    shouldShow: ({ isAuthenticated }) => !isAuthenticated,
  },
  {
    label: "Sign up",
    key: "signup",
    icon: <AccountCircleOutlinedIcon fontSize="small" />,
    href: "auth/register",
    shouldShow: ({ isAuthenticated }) => !isAuthenticated,
  },
  {
    label: "Examples",
    key: "examples",
    icon: <LightbulbOutlined fontSize="small" />,
    href: "scenes/examples",
  },
  {
    label: "Contact",
    key: "contact",
    icon: <HelpOutlineOutlinedIcon fontSize="small" />,
    href: "contact",
    shouldShow: () => true,
  },
  {
    label: "Sign out",
    key: "signout",
    icon: <AccountCircleOutlinedIcon fontSize="small" />,
    href: "auth/logout",
    shouldShow: ({ isAuthenticated }) => isAuthenticated,
  },
];

const HeaderMenu: React.FC = () => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const [isAuthenticated] = useAuthStatus();
  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) => !!item.shouldShow?.({ smallScreen, isAuthenticated }),
      ),
    [smallScreen, isAuthenticated],
  );
  const userQuery = useUserMe({ enabled: isAuthenticated });
  return (
    <nav className={styles["nav-container"]}>
      <ShareButton variant={smallScreen ? "mobile" : "desktop"} />
      {smallScreen ? null : (
        <LoginButtons isAuthenticated={isAuthenticated} smallScreen={false} />
      )}
      <UserMenu items={filteredItems} user={userQuery.data} />
    </nav>
  );
};

type HeaderProps = {
  title: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={styles.header}>
    <div className={styles["header-container"]}>
      <span className={styles.brand}>Math3d</span>
      {props.title}
      <HeaderMenu />
    </div>
  </header>
);

export default Header;
