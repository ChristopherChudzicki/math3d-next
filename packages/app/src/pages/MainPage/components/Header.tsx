import React, { useMemo } from "react";
import invariant from "tiny-invariant";
import Header from "@/util/components/Header";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";

import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import type { AuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import type { OverlayName } from "@/features/overlays/useOverlay";
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
  isAuthenticated: AuthStatus;
}> = ({ smallScreen, isAuthenticated }) => {
  const { open } = useOverlay();
  if (isAuthenticated !== "unauthenticated" || !DISPLAY_AUTH_FLOWS) return null;
  if (smallScreen) {
    return (
      <>
        <MenuItem onClick={() => open("login")}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign in</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => open("register")}>
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
        onClick={() => open("register")}
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign up
      </Button>
      <Button
        variant="text"
        color="secondary"
        onClick={() => open("login")}
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign in
      </Button>
    </>
  );
};

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;
invariant(ISSUE_URL, "VITE_ISSUE_URL is not set");

type FilterableItem = SimpleMenuItem & {
  shouldShow: boolean;
};
const getItems = ({
  user,
  open,
}: {
  user?: User | null;
  open: (name: OverlayName) => void;
}): FilterableItem[] => {
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
      type: "button",
      key: "signin",
      label: "Sign in",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      onClick: () => open("login"),
      shouldShow: !isAuthenticated && DISPLAY_AUTH_FLOWS,
    },
    {
      type: "button",
      label: "Sign up",
      key: "signup",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      onClick: () => open("register"),
      shouldShow: !isAuthenticated && DISPLAY_AUTH_FLOWS,
    },
    {
      type: "link",
      label: "My Scenes",
      key: "scenes-me",
      icon: <ListIcon fontSize="small" />,
      href: "scenes/me",
      shouldShow: isAuthenticated,
    },
    {
      type: "link",
      label: "Examples",
      key: "examples",
      icon: <LightbulbOutlined fontSize="small" />,
      href: "scenes/examples",
      shouldShow: true,
    },
    {
      type: "link",
      label: "Function Reference",
      key: "reference",
      icon: <FunctionsIcon fontSize="small" />,
      href: "/app/help/reference",
      shouldShow: true,
      target: "_blank",
    },
    {
      type: "link",
      label: "Contact",
      key: "contact",
      icon: <HelpOutlineOutlinedIcon fontSize="small" />,
      href: ISSUE_URL,
      LinkComponent: "a",
      target: "_blank",
      rel: "noreferrer",
      shouldShow: true,
    },
    {
      type: "button",
      label: "Account Settings",
      key: "settings",
      icon: <ManageAccountsIcon fontSize="small" />,
      onClick: () => open("settings"),
      shouldShow: isAuthenticated,
    },
    {
      type: "button",
      label: "Sign out",
      key: "signout",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      onClick: () => open("logout"),
      shouldShow: isAuthenticated,
    },
  ];
};

type AppHeaderProps = {
  title: React.ReactNode;
};

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const isAuthenticated = useAuthStatus();
  const userQuery = useUserMe();
  const { open } = useOverlay();
  const filteredItems = useMemo(
    () =>
      getItems({ user: userQuery.data, open }).filter(
        (item) => !!item.shouldShow,
      ),
    [userQuery.data, open],
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
