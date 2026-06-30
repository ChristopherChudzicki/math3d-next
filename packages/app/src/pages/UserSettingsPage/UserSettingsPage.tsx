import React, { useCallback, useEffect, useState } from "react";
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

type TabConfig = {
  id: string;
  label: string;
  Component: React.FC<{ id: string; setDisabled: (disabled: boolean) => void }>;
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

  // Settings acts on the signed-in user; if there's none, send them to login.
  // Switching overlays replaces history, so no junk back-stack entry.
  useEffect(() => {
    if (isAuthenticated === "unauthenticated") open("login");
  }, [isAuthenticated, open]);

  // Don't mount the forms until we know there's a user — otherwise they fire
  // requests against a missing account during the redirect / auth check.
  if (isAuthenticated !== "authenticated") return null;

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
              <t.Component id={t.id} setDisabled={setDisabled} />
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
