import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import React, { useState } from "react";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useNotifications } from "./NotificationsContext";

const NotificationsDisplay: React.FC = () => {
  const [pendingRemovals, setPendingRemovals] = useState(
    new Map<string, boolean>(),
  );
  const { notifications, remove } = useNotifications();
  return (
    <>
      {notifications.map((n) => (
        <Dialog
          fullWidth
          maxWidth="sm"
          key={n.id}
          open={!pendingRemovals.has(n.id)}
          onTransitionExited={() => {
            remove(n.id, pendingRemovals.get(n.id) ?? false);
            setPendingRemovals((prev) => {
              const copy = new Map(prev);
              copy.delete(n.id);
              return copy;
            });
          }}
        >
          <DialogTitle>{n.title}</DialogTitle>
          <DialogContent>{n.body}</DialogContent>
          <DialogActions>
            {n.type === "confirmation" ? (
              <>
                <Button
                  onClick={() => {
                    setPendingRemovals((prev) => {
                      const copy = new Map(prev);
                      copy.set(n.id, false);
                      return copy;
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setPendingRemovals((prev) => {
                      const copy = new Map(prev);
                      copy.set(n.id, true);
                      return copy;
                    });
                  }}
                >
                  Confirm
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setPendingRemovals((prev) => {
                    const copy = new Map(prev);
                    copy.set(n.id, false);
                    return copy;
                  });
                }}
              >
                OK
              </Button>
            )}
          </DialogActions>
        </Dialog>
      ))}
    </>
  );
};

export default NotificationsDisplay;
