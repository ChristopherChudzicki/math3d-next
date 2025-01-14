import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/util/components/Header";

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
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ListIcon from "@mui/icons-material/List";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import { useUserMe, User } from "@math3d/api";
import ListSubheader from "@mui/material/ListSubheader";
import FunctionsIcon from "@mui/icons-material/Functions";

import UserMenu from "./UserMenu";
import SaveButton from "./SaveButton";

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
const getItems = ({ user }: { user?: User | null }): FilterableItem[] => {
  const isAuthenticated = !!user;
  return [
    {
      element: (
        <ListSubheader
          data-testid="username-display"
          key="header"
          component="div"
          sx={{
            textOverflow: "ellipsis",
            overflow: "hidden",
            lineHeight: "unset",
          }}
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
      label: "Function Reference",
      key: "reference",
      icon: <FunctionsIcon fontSize="small" />,
      href: "help/reference",
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
      label: "Account Settings",
      key: "settings",
      icon: <ManageAccountsIcon fontSize="small" />,
      href: "user/settings",
      shouldShow: isAuthenticated,
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

type AppHeaderProps = {
  title: React.ReactNode;
};

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const [isAuthenticated] = useAuthStatus();
  const userQuery = useUserMe();
  const filteredItems = useMemo(
    () =>
      getItems({ user: userQuery.data }).filter((item) => !!item.shouldShow),
    [userQuery.data],
  );
  return (
    <Header
      title={props.title}
      nav={
        <>
          <SaveButton />
          <ShareButton variant={smallScreen ? "mobile" : "desktop"} />
          {smallScreen ? null : (
            <LoginButtons
              isAuthenticated={isAuthenticated}
              smallScreen={false}
            />
          )}
          <UserMenu items={filteredItems} user={userQuery.data} />
        </>
      }
    />
  );
};

export default AppHeader;
