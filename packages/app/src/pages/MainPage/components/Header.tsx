import React, { useMemo } from "react";
import { Link } from "react-router-dom";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";

import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuthStatus } from "@/features/auth";
import Button from "@mui/material/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import ListIcon from "@mui/icons-material/List";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import { useUserMe, User } from "@math3d/api";
import ListSubheader from "@mui/material/ListSubheader";
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
  shouldShow: boolean;
};
const getItems = ({ user }: { user?: User }): FilterableItem[] => {
  const isAuthenticated = !!user;
  return [
    {
      element: (
        <ListSubheader
          data-testid="username-display"
          key="header"
          component="div"
          className={styles["menu-header"]}
        >
          {user?.email}
        </ListSubheader>
      ),
      shouldShow: isAuthenticated,
    },
    {
      key: "signin",
      label: "Sign in",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      href: "auth/login",
      shouldShow: !isAuthenticated,
    },
    {
      label: "Sign up",
      key: "signup",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      href: "auth/register",
      shouldShow: !isAuthenticated,
    },
    {
      label: "My Scenes",
      key: "scenes-me",
      icon: <ListIcon fontSize="small" />,
      href: "scenes/me",
      shouldShow: isAuthenticated,
    },
    {
      label: "Examples",
      key: "examples",
      icon: <LightbulbOutlined fontSize="small" />,
      href: "scenes/examples",
      shouldShow: true,
    },
    {
      label: "Contact",
      key: "contact",
      icon: <HelpOutlineOutlinedIcon fontSize="small" />,
      href: "contact",
      shouldShow: true,
    },
    {
      label: "Sign out",
      key: "signout",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      href: "auth/logout",
      shouldShow: isAuthenticated,
    },
  ];
};

const HeaderMenu: React.FC = () => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const [isAuthenticated] = useAuthStatus();
  const userQuery = useUserMe({ enabled: isAuthenticated });
  const filteredItems = useMemo(
    () =>
      getItems({ user: userQuery.data }).filter((item) => !!item.shouldShow),
    [userQuery.data],
  );

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
