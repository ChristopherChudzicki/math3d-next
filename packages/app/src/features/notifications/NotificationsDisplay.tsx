import React, { useState } from "react";
import { AlertDialog } from "@/ui/AlertDialog";
import Button from "@/ui/Button";
import { useNotifications } from "./NotificationsContext";
import type { Notification } from "./NotificationsContext";

type NotificationDialogProps = {
  notification: Notification;
  onClosed: (id: string, confirmed: boolean) => void;
};

const NotificationDialog: React.FC<NotificationDialogProps> = ({
  notification: n,
  onClosed,
}) => {
  // Set when the dialog closes; reported once its exit animation completes.
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  return (
    <AlertDialog.Root
      open={confirmed === null}
      onOpenChange={(open) => {
        // Escape, Cancel, or OK.
        if (!open) setConfirmed((prev) => prev ?? false);
      }}
      onOpenChangeComplete={(open) => {
        if (!open) onClosed(n.id, confirmed ?? false);
      }}
    >
      <AlertDialog.Popup>
        <AlertDialog.Title>{n.title}</AlertDialog.Title>
        <AlertDialog.Description>{n.body}</AlertDialog.Description>
        <AlertDialog.Actions>
          {n.type === "confirmation" ? (
            <>
              <AlertDialog.Close render={<Button>Cancel</Button>} />
              <Button
                variant="solid"
                tone="accent"
                onClick={() => setConfirmed((prev) => prev ?? true)}
              >
                Confirm
              </Button>
            </>
          ) : (
            <AlertDialog.Close
              render={
                <Button variant="solid" tone="accent">
                  OK
                </Button>
              }
            />
          )}
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
};

/**
 * Shows the newest notification; the one beneath it shows once it resolves.
 * Base UI modals opened side by side hide each other from assistive tech, so
 * they take turns rather than stack.
 */
const NotificationsDisplay: React.FC = () => {
  const { notifications, remove } = useNotifications();
  const current = notifications.at(-1);
  return current ? (
    <NotificationDialog
      key={current.id}
      notification={current}
      onClosed={remove}
    />
  ) : null;
};

export default NotificationsDisplay;
