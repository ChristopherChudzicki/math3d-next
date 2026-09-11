import React, { useMemo } from "react";
import invariant from "tiny-invariant";
import Header from "@/util/components/Header";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";

import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import type { AuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import type { OverlayName } from "@/features/overlays/useOverlay";
import Button from "@mui/material/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ListIcon from "@mui/icons-material/List";
import type { SimpleMenuItem } from "@/util/components/SimpleMenu/SimpleMenu";
import { useUserMe } from "@math3d/api";
import ListSubheader from "@mui/material/ListSubheader";
import FunctionsIcon from "@mui/icons-material/Functions";

import UserMenu from "./UserMenu";
import SaveButton from "./SaveButton";

const LoginButtons: React.FC<{
  isAuthenticated: AuthStatus;
}> = ({ isAuthenticated }) => {
  const { open } = useOverlay();
  if (isAuthenticated !== "unauthenticated" || !DISPLAY_AUTH_FLOWS) return null;
  return (
    <Button
      variant="text"
      color="secondary"
      onClick={() => open("login")}
      startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
    >
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
}: {
  authStatus: AuthStatus;
  email?: string;
  open: (name: OverlayName, companion?: { list?: string }) => void;
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
      onClick: () => open("login"),
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

const AppHeader: React.FC<AppHeaderProps> = (props) => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const isAuthenticated = useAuthStatus();
  const userQuery = useUserMe();
  const { open } = useOverlay();
  const filteredItems = useMemo(
    () =>
      getItems({
        authStatus: isAuthenticated,
        email: userQuery.data?.email,
        open,
      }).filter((item) => !!item.shouldShow),
    [isAuthenticated, userQuery.data, open],
  );
  return (
    <Header
      title={props.title}
      nav={
        <>
          <SaveButton />
          <ShareButton variant={smallScreen ? "mobile" : "desktop"} />
          {smallScreen ? null : (
            <LoginButtons isAuthenticated={isAuthenticated} />
          )}
          <UserMenu items={filteredItems} authStatus={isAuthenticated} />
        </>
      }
    />
  );
};

export default AppHeader;
