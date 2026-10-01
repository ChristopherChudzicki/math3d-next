import React, { useCallback, useEffect, useRef, useState } from "react";
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
  // The choice is made on close and reported once the exit animation
  // completes. A ref, so it survives a newer notification replacing this one
  // in the same render.
  const choice = useRef<boolean | null>(null);
  const reported = useRef(false);
  const [open, setOpen] = useState(true);
  const choose = (confirmed: boolean) => {
    if (choice.current !== null) return;
    choice.current = confirmed;
    setOpen(false);
  };
  const report = useCallback(() => {
    if (reported.current || choice.current === null) return;
    reported.current = true;
    onClosed(n.id, choice.current);
  }, [onClosed, n.id]);
  // Replaced mid-exit by a newer notification: a choice already made counts.
  const reportOnUnmount = useRef(report);
  useEffect(() => {
    reportOnUnmount.current = report;
  }, [report]);
  useEffect(() => () => reportOnUnmount.current(), []);
  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(next) => {
        // Escape, Cancel, or OK.
        if (!next) choose(false);
      }}
      onOpenChangeComplete={(next) => {
        if (!next) report();
      }}
    >
      <AlertDialog.Popup>
        <AlertDialog.Title>{n.title}</AlertDialog.Title>
        {/* A div: the body may be more than a paragraph. */}
        <AlertDialog.Description render={<div />}>
          {n.body}
        </AlertDialog.Description>
        <AlertDialog.Actions>
          {n.type === "confirmation" ? (
            <>
              <AlertDialog.Close render={<Button>Cancel</Button>} />
              <Button
                variant="solid"
                tone="accent"
                onClick={() => choose(true)}
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
