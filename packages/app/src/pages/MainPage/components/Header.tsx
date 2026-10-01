import React, { useMemo } from "react";
import invariant from "tiny-invariant";
import Header from "@/ui/Header";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import { SceneActions } from "@/features/sceneActions";

import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import type { AuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import type { OverlayName } from "@/features/overlays/useOverlay";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import Button from "@/ui/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ListIcon from "@mui/icons-material/List";
import type { SimpleMenuItem } from "@/ui/SimpleMenu/SimpleMenu";
import { useUserMe } from "@math3d/api";
import ListSubheader from "@mui/material/ListSubheader";
import FunctionsIcon from "@mui/icons-material/Functions";
import { Icon } from "@iconify/react/offline";
import folderOpen from "@iconify-icons/lucide/folder-open";
import IconButton from "@/ui/IconButton";
import { OPEN_SCENES_BUTTON_ID } from "@/pages/ScenesList/constants";

import UserMenu from "./UserMenu";
import * as styles from "./Header.module.css";

const LoginButtons: React.FC<{
  isAuthenticated: AuthStatus;
}> = ({ isAuthenticated }) => {
  const signIn = useSignInDialog();
  if (isAuthenticated !== "unauthenticated" || !DISPLAY_AUTH_FLOWS) return null;
  return (
    <Button
      className={styles["sign-in"]}
      variant="ghost"
      onClick={() => signIn.open()}
    >
      <AccountCircleOutlinedIcon fontSize="small" />
      Sign in
    </Button>
  );
};

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;
invariant(ISSUE_URL, "VITE_ISSUE_URL is not set");

type FilterableItem = SimpleMenuItem & {
  shouldShow: boolean;
};
const getItems = ({
  authStatus,
  email,
  open,
  openSignIn,
}: {
  authStatus: AuthStatus;
  email?: string;
  open: (name: OverlayName, companion?: { list?: string }) => void;
  openSignIn: () => void;
}): FilterableItem[] => {
  const isAuthenticated = authStatus === "authenticated";
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
          {email}
        </ListSubheader>
      ),
      shouldShow: isAuthenticated,
    },
    {
      type: "button",
      key: "signin",
      label: "Sign in",
      icon: <AccountCircleOutlinedIcon fontSize="small" />,
      onClick: openSignIn,
      // Not `!isAuthenticated`: while the me-query is still in flight the
      // answer is unknown, and offering to sign in is the wrong guess for a
      // user who already has a session.
      shouldShow: authStatus === "unauthenticated" && DISPLAY_AUTH_FLOWS,
    },
    {
      type: "button",
      label: "My Scenes",
      key: "scenes-me",
      icon: <ListIcon fontSize="small" />,
      onClick: () => open("scenes", { list: "me" }),
      shouldShow: isAuthenticated,
    },
    {
      type: "button",
      label: "Examples",
      key: "examples",
      icon: <LightbulbOutlined fontSize="small" />,
      onClick: () => open("scenes", { list: "examples" }),
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
      label: "Delete Account",
      key: "delete-account",
      icon: <DeleteForeverIcon fontSize="small" />,
      onClick: () => open("delete-account"),
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

const OpenScenesButton: React.FC<{ authStatus: AuthStatus }> = ({
  authStatus,
}) => {
  const { open } = useOverlay();
  return (
    <IconButton
      id={OPEN_SCENES_BUTTON_ID}
      label="Open scenes"
      onClick={() =>
        open("scenes", {
          list: authStatus === "authenticated" ? "me" : "examples",
        })
      }
    >
      <Icon icon={folderOpen} aria-hidden="true" />
    </IconButton>
  );
};

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const isAuthenticated = useAuthStatus();
  const userQuery = useUserMe();
  const { open } = useOverlay();
  const { open: openSignIn } = useSignInDialog();
  const filteredItems = useMemo(
    () =>
      getItems({
        authStatus: isAuthenticated,
        email: userQuery.data?.email,
        open,
        openSignIn: () => openSignIn(),
      }).filter((item) => !!item.shouldShow),
    [isAuthenticated, userQuery.data, open, openSignIn],
  );
  return (
    <Header
      start={<OpenScenesButton authStatus={isAuthenticated} />}
      title={props.title}
      nav={
        <>
          <SceneActions />
          <LoginButtons isAuthenticated={isAuthenticated} />
          <UserMenu items={filteredItems} authStatus={isAuthenticated} />
        </>
      }
    />
  );
};

export default AppHeader;
