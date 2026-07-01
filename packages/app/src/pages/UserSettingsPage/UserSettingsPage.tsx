import React, { useCallback, useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import invariant from "tiny-invariant";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import ProfileForm from "./ProfilleForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountForm from "./DeleteAccountForm";
import * as styles from "./UserSettingsPage.module.css";

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
};

type TabComponentProps = {
  id: string;
  setDisabled: (disabled: boolean) => void;
  /**
   * Called by the Delete Account tab when the user submits deletion, so the
   * dialog knows the coming sign-out is deliberate and skips the login redirect.
   * A no-op for the other tabs.
   */
  onSelfDelete: () => void;
};

type TabConfig = {
  id: string;
  label: string;
  Component: React.FC<TabComponentProps>;
  submitButtonProps: ButtonProps;
};

const TABS: TabConfig[] = [
  {
    id: "profile_form",
    label: "Profile",
    Component: ProfileForm,
    submitButtonProps: {
      children: "Save",
    },
  },
  {
    id: "change_password_form",
    label: "Change Password",
    Component: ChangePasswordForm,
    submitButtonProps: {
      children: "Save",
    },
  },
  {
    id: "delete_account_form",
    label: "Delete Account",
    Component: DeleteAccountForm,
    submitButtonProps: {
      children: "Delete Account",
      color: "error",
    },
  },
];

const UserSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const tab = TABS.find((t) => t.id === activeTab);
  invariant(tab);
  const [disabled, setDisabled] = useState(false);
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // Deleting your account is the only in-dialog action that signs you out, and
  // it flips auth authenticated → unauthenticated. Flag that deliberate case so
  // the redirect below doesn't treat it like a logged-out visitor: it has its
  // own flow (the "Account Deleted" notice + navigate away) that a login
  // redirect would hijack. Set imperatively from the tab's submit handler.
  const selfDeleted = useRef(false);
  const handleSelfDelete = useCallback(() => {
    selfDeleted.current = true;
  }, []);

  // Redirect anyone who is unauthenticated *without* deliberately deleting — a
  // hand-typed /?overlay=settings while logged out, or a session that expired
  // mid-dialog — to the login overlay (a switch, so it replaces history).
  useEffect(() => {
    if (isAuthenticated === "unauthenticated" && !selfDeleted.current) {
      open("login");
    }
  }, [isAuthenticated, open]);

  // Don't mount the forms unless we have a user — a cold/expired visitor would
  // otherwise fire requests against a missing account while we redirect. The
  // deliberate self-delete case keeps rendering so its own flow can finish.
  if (isAuthenticated !== "authenticated" && !selfDeleted.current) return null;

  return (
    <Dialog open fullWidth maxWidth="sm" onClose={handleClose}>
      <div style={topRightStyle}>
        <IconButton onClick={handleClose} aria-label="Close">
          <Close />
        </IconButton>
      </div>
      <DialogTitle>Account Settings</DialogTitle>
      <TabContext value={activeTab}>
        <DialogContent className={styles.container}>
          <TabList
            orientation="vertical"
            onChange={(_e, val) => {
              setActiveTab(val);
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </TabList>
          {TABS.map((t) => (
            <TabPanel className={styles.panel} key={t.id} value={t.id}>
              <t.Component
                id={t.id}
                setDisabled={setDisabled}
                onSelfDelete={handleSelfDelete}
              />
            </TabPanel>
          ))}
        </DialogContent>
      </TabContext>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          disabled={disabled}
          variant="contained"
          color="primary"
          type="submit"
          form={activeTab}
          {...tab.submitButtonProps}
        />
      </DialogActions>
    </Dialog>
  );
};

export default UserSettingsPage;
