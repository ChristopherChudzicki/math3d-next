import React from "react";
import classNames from "classnames";
import { Icon } from "@iconify/react/offline";
import type { IconifyIcon } from "@iconify/react/offline";
import circleAlert from "@iconify-icons/lucide/circle-alert";
import triangleAlert from "@iconify-icons/lucide/triangle-alert";
import info from "@iconify-icons/lucide/info";
import circleCheck from "@iconify-icons/lucide/circle-check";
import * as styles from "./Alert.module.css";

type AlertSeverity = "error" | "warning" | "info" | "success";

const ICONS: Record<AlertSeverity, IconifyIcon> = {
  error: circleAlert,
  warning: triangleAlert,
  info,
  success: circleCheck,
};

type AlertProps = {
  severity: AlertSeverity;
  children: React.ReactNode;
  /** Controls at the end, such as a dismiss button. */
  action?: React.ReactNode;
  /**
   * `alert` interrupts a screen reader; `status` waits for it to finish.
   * Defaults to `alert` for errors and `status` otherwise.
   */
  role?: "alert" | "status";
  className?: string;
};

const Alert: React.FC<AlertProps> = ({
  severity,
  children,
  action,
  role = severity === "error" ? "alert" : "status",
  className,
}) => (
  <div
    role={role}
    className={classNames(styles.alert, styles[severity], className)}
  >
    <Icon icon={ICONS[severity]} className={styles.icon} aria-hidden="true" />
    <div className={styles.message}>{children}</div>
    {action ? <div className={styles.action}>{action}</div> : null}
  </div>
);

export default Alert;
export type { AlertProps, AlertSeverity };
