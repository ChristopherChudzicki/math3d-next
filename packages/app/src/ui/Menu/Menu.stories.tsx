import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "@iconify/react";
import menuIcon from "@iconify-icons/lucide/menu";
import circleUser from "@iconify-icons/lucide/circle-user";
import list from "@iconify-icons/lucide/list";
import lightbulb from "@iconify-icons/lucide/lightbulb";
import sigma from "@iconify-icons/lucide/sigma";
import circleHelp from "@iconify-icons/lucide/circle-help";
import trash2 from "@iconify-icons/lucide/trash-2";
import logOut from "@iconify-icons/lucide/log-out";
import IconButton from "../IconButton";
import { Menu } from ".";

const UserMenu: React.FC = () => (
  <div style={{ display: "flex", justifyContent: "flex-end", width: 480 }}>
    <Menu.Root defaultOpen>
      <Menu.Trigger
        render={
          <IconButton label="Menu">
            <Icon icon={menuIcon} />
          </IconButton>
        }
      />
      <Menu.Popup>
        <Menu.Group>
          <Menu.GroupLabel>someone@example.com</Menu.GroupLabel>
          <Menu.Item icon={<Icon icon={list} />}>My Scenes</Menu.Item>
          <Menu.Item icon={<Icon icon={lightbulb} />}>Examples</Menu.Item>
          <Menu.LinkItem href="#reference" icon={<Icon icon={sigma} />}>
            Function Reference
          </Menu.LinkItem>
          <Menu.Item icon={<Icon icon={circleHelp} />} disabled>
            Contact (disabled)
          </Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Item icon={<Icon icon={circleUser} />}>Account</Menu.Item>
        <Menu.Item icon={<Icon icon={trash2} />} tone="danger">
          Delete Account
        </Menu.Item>
        <Menu.Item icon={<Icon icon={logOut} />}>Sign out</Menu.Item>
      </Menu.Popup>
    </Menu.Root>
  </div>
);

const meta: Meta<typeof UserMenu> = {
  title: "ui/Menu",
  component: UserMenu,
};
export default meta;

export const AllVariants: StoryObj<typeof UserMenu> = {
  parameters: { layout: "padded" },
};
