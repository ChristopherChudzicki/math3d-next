import React from "react";
import { Link } from "react-router";
import invariant from "tiny-invariant";
import Header from "@/ui/Header";

import lightbulb from "@iconify-icons/lucide/lightbulb";
import circleHelp from "@iconify-icons/lucide/circle-help";
import { SceneActions } from "@/features/sceneActions";

import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import type { AuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import Button from "@/ui/Button";
import circleUser from "@iconify-icons/lucide/circle-user";
import trash2 from "@iconify-icons/lucide/trash-2";
import list from "@iconify-icons/lucide/list";
import { useUserMe } from "@math3d/api";
import sigma from "@iconify-icons/lucide/sigma";
import { Icon } from "@iconify/react/offline";
import folderOpen from "@iconify-icons/lucide/folder-open";
import IconButton from "@/ui/IconButton";
import { Menu } from "@/ui/Menu";
import { OPEN_SCENES_BUTTON_ID } from "@/pages/ScenesList/constants";

import UserMenu from "./UserMenu";
import styles from "./Header.module.css";

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
      <Icon icon={circleUser} aria-hidden="true" />
      Sign in
    </Button>
  );
};

const ISSUE_URL = import.meta.env.VITE_ISSUE_URL;
invariant(ISSUE_URL, "VITE_ISSUE_URL is not set");

const UserMenuItems: React.FC<{ authStatus: AuthStatus }> = ({
  authStatus,
}) => {
  const { open } = useOverlay();
  const { open: openSignIn } = useSignInDialog();
  const isAuthenticated = authStatus === "authenticated";
  return (
    <>
      {/* Not `!isAuthenticated`: while the me-query is still in flight the
          answer is unknown, and offering to sign in is the wrong guess for a
          user who already has a session. */}
      {authStatus === "unauthenticated" && DISPLAY_AUTH_FLOWS && (
        <Menu.Item
          icon={<Icon icon={circleUser} aria-hidden="true" />}
          onClick={() => openSignIn()}
        >
          Sign in
        </Menu.Item>
      )}
      {isAuthenticated && (
        <Menu.Item
          icon={<Icon icon={list} aria-hidden="true" />}
          onClick={() => open("scenes", { list: "me" })}
        >
          My Scenes
        </Menu.Item>
      )}
      <Menu.Item
        icon={<Icon icon={lightbulb} aria-hidden="true" />}
        onClick={() => open("scenes", { list: "examples" })}
      >
        Examples
      </Menu.Item>
      <Menu.LinkItem
        icon={<Icon icon={sigma} aria-hidden="true" />}
        render={<Link to="/app/help/reference" target="_blank" />}
      >
        Function Reference
      </Menu.LinkItem>
      <Menu.LinkItem
        icon={<Icon icon={circleHelp} aria-hidden="true" />}
        href={ISSUE_URL}
        target="_blank"
        rel="noreferrer"
      >
        Contact
      </Menu.LinkItem>
      {isAuthenticated && (
        <Menu.Item
          icon={<Icon icon={trash2} aria-hidden="true" />}
          tone="danger"
          onClick={() => open("delete-account")}
        >
          Delete Account
        </Menu.Item>
      )}
      {isAuthenticated && (
        <Menu.Item
          icon={<Icon icon={circleUser} aria-hidden="true" />}
          onClick={() => open("logout")}
        >
          Sign out
        </Menu.Item>
      )}
    </>
  );
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
  const authStatus = useAuthStatus();
  const userQuery = useUserMe();
  return (
    <Header
      start={<OpenScenesButton authStatus={authStatus} />}
      title={props.title}
      nav={
        <>
          <SceneActions />
          <LoginButtons isAuthenticated={authStatus} />
          <UserMenu authStatus={authStatus} email={userQuery.data?.email}>
            <UserMenuItems authStatus={authStatus} />
          </UserMenu>
        </>
      }
    />
  );
};

export default AppHeader;
