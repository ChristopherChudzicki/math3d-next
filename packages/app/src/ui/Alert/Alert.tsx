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
   * Whether a screen reader announces it: an error interrupts (`alert`),
   * anything else waits its turn (`status`). Pass `false` for content that
   * isn't news, or that sits inside a live region already.
   */
  announce?: boolean;
  className?: string;
};

const roleFor = (severity: AlertSeverity) =>
  severity === "error" ? "alert" : "status";

const Alert: React.FC<AlertProps> = ({
  severity,
  children,
  action,
  announce = true,
  className,
}) => (
  <div
    role={announce ? roleFor(severity) : undefined}
    className={classNames(styles.alert, styles[severity], className)}
  >
    <Icon icon={ICONS[severity]} className={styles.icon} aria-hidden="true" />
    <div className={styles.message}>{children}</div>
    {action ? <div className={styles.action}>{action}</div> : null}
  </div>
);

export default Alert;
export type { AlertProps, AlertSeverity };
