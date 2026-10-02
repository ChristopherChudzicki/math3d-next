import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs } from ".";

const states = ["rest", "hover", "focus-visible", "disabled"] as const;

const heading: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-text-primary)",
  margin: "0 0 4px",
};

const AllTabs: React.FC = () => (
  <div style={{ display: "grid", gap: 24 }}>
    <div>
      <p style={heading}>Interactive (click, or arrows then Enter)</p>
      <Tabs.Root defaultValue="me">
        <Tabs.List aria-label="Scenes">
          <Tabs.Tab value="me">My Scenes</Tabs.Tab>
          <Tabs.Tab value="examples">Examples</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="me">My Scenes panel</Tabs.Panel>
        <Tabs.Panel value="examples">Examples panel</Tabs.Panel>
      </Tabs.Root>
    </div>
    <div>
      <p style={heading}>States of an unselected tab, beside a selected one</p>
      <Tabs.Root value="selected">
        <Tabs.List aria-label="States">
          <Tabs.Tab value="selected">selected</Tabs.Tab>
          {states.map((state) => (
            <Tabs.Tab
              key={state}
              value={state}
              data-pseudo={state}
              disabled={state === "disabled"}
            >
              {state}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </div>
  </div>
);

const meta: Meta<typeof AllTabs> = {
  title: "ui/Tabs",
  component: AllTabs,
};
export default meta;

export const AllVariants: StoryObj<typeof AllTabs> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
