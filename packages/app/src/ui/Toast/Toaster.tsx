import React from "react";
import { Toast } from "@base-ui/react/toast";
import type { ToastManager } from "@base-ui/react/toast";
import { Icon } from "@iconify/react/offline";
import circleAlert from "@iconify-icons/lucide/circle-alert";
import x from "@iconify-icons/lucide/x";
import Button from "@/ui/Button";
import IconButton from "@/ui/IconButton";
import * as styles from "./Toaster.module.css";

const ToastList: React.FC = () => {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      swipeDirection="up"
      className={styles.toast}
      // Without a Toast.Title, the root (role="dialog") has no name.
      aria-label="Error"
    >
      <Toast.Content className={styles.content}>
        <Icon icon={circleAlert} className={styles.icon} aria-hidden="true" />
        <Toast.Description className={styles.description} />
        <Toast.Close render={<IconButton label="Dismiss" size="sm" />}>
          <Icon icon={x} aria-hidden="true" />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
};

/** The app's one toast stack, fed by `toastManager`. */
const Toaster: React.FC<{ toastManager: ToastManager }> = ({
  toastManager,
}) => (
  <Toast.Provider toastManager={toastManager}>
    <Toast.Portal>
      <Toast.Viewport
        className={styles.viewport}
        // An open dialog or drawer closes on Escape at `document`; F6 focuses
        // this viewport, so stop it here rather than on each toast.
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
        }}
      >
        <ToastList />
      </Toast.Viewport>
    </Toast.Portal>
  </Toast.Provider>
);

const NoticeList: React.FC = () => {
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Positioner
      key={toast.id}
      toast={toast}
      side="right"
      sideOffset={8}
      className={styles.positioner}
    >
      <Toast.Root toast={toast} className={styles.notice} aria-label="Notice">
        <Toast.Content className={styles.noticeContent}>
          <Toast.Description className={styles.description} />
          {toast.actionProps ? (
            <Toast.Action
              render={<Button size="sm" variant="ghost" tone="primary" />}
            />
          ) : null}
          <Toast.Close render={<IconButton label="Dismiss" size="sm" />}>
            <Icon icon={x} aria-hidden="true" />
          </Toast.Close>
        </Toast.Content>
      </Toast.Root>
    </Toast.Positioner>
  ));
};

/**
 * Short notices shown beside the element they're about (`positionerProps`'
 * `anchor`). A separate stack from `Toaster`'s: its viewport is transformed,
 * which would offset anchored toasts.
 */
const NoticeToaster: React.FC<{ toastManager: ToastManager }> = ({
  toastManager,
}) => (
  <Toast.Provider toastManager={toastManager}>
    <Toast.Portal>
      <Toast.Viewport aria-label="Notices">
        <NoticeList />
      </Toast.Viewport>
    </Toast.Portal>
  </Toast.Provider>
);

const { createToastManager } = Toast;

export default Toaster;
export { createToastManager, NoticeToaster };
export type { ToastManager };
