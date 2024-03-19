import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useState } from "react";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useNotifications } from "./NotificationsContext";

const NotificationsDisplay: React.FC = () => {
  const [closed, setClosed] = useState(new Set<string>());
  const { notifications, remove } = useNotifications();
  return (
    <>
      {notifications.map((n) => (
        <Dialog
          fullWidth
          maxWidth="sm"
          key={n.id}
          open={!closed.has(n.id)}
          onTransitionExited={() => {
            remove(n.id);
            setClosed((prev) => {
              const copy = new Set(prev);
              copy.delete(n.id);
              return copy;
            });
          }}
        >
          <DialogTitle>{n.title}</DialogTitle>
          <DialogContent>{n.body}</DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setClosed((prev) => {
                  const copy = new Set(prev);
                  copy.add(n.id);
                  return copy;
                });
              }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
};

export default NotificationsDisplay;
