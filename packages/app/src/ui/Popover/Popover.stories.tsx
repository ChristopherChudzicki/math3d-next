import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@iconify/react/offline";
import settings from "@iconify-icons/lucide/settings";
import IconButton from "../IconButton";
import TextField from "../TextField";
import { Popover } from ".";

const SettingsPopover: React.FC = () => (
  <Popover.Root defaultOpen>
    <Popover.Trigger
      render={
        <IconButton label="More Settings">
          <Icon icon={settings} aria-hidden="true" />
        </IconButton>
      }
    />
    <Popover.Popup side="right" style={{ padding: "0.5rem 1rem 1rem" }}>
      <Popover.Title>Point Settings</Popover.Title>
      <TextField label="Opacity" defaultValue="0.75" />
    </Popover.Popup>
  </Popover.Root>
);

const meta: Meta<typeof SettingsPopover> = {
  title: "ui/Popover",
  component: SettingsPopover,
};
export default meta;

export const Default: StoryObj<typeof SettingsPopover> = {
  parameters: { layout: "padded" },
};
