import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@iconify/react/offline";
import x from "@iconify-icons/lucide/x";
import IconButton from "../IconButton";
import Alert from "./Alert";
import type { AlertSeverity } from "./Alert";

const severities: AlertSeverity[] = ["error", "warning", "info", "success"];

const AllAlerts: React.FC = () => (
  <div style={{ display: "grid", gap: "1rem", maxWidth: "36rem" }}>
    {severities.map((severity) => (
      <Alert key={severity} severity={severity}>
        Severity &ldquo;{severity}&rdquo;, with a message long enough to wrap
        onto a second line in a narrow container.
      </Alert>
    ))}
    <Alert
      severity="warning"
      action={
        <IconButton size="sm" label="Dismiss notice">
          <Icon icon={x} aria-hidden="true" />
        </IconButton>
      }
    >
      With an action.
    </Alert>
  </div>
);

const meta: Meta<typeof AllAlerts> = {
  title: "ui/Alert",
  component: AllAlerts,
};
export default meta;

export const AllVariants: StoryObj<typeof AllAlerts> = {};
