import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import { Tooltip } from ".";

const sides = ["top", "right", "bottom", "left"] as const;

const AllSides: React.FC = () => (
  <div style={{ display: "flex", gap: "10rem", padding: "4rem 6rem" }}>
    {sides.map((side) => (
      <Tooltip.Root key={side} defaultOpen>
        <Tooltip.Trigger render={<Button>{side}</Button>} />
        <Tooltip.Popup side={side}>Long press to change color</Tooltip.Popup>
      </Tooltip.Root>
    ))}
  </div>
);

const meta: Meta<typeof AllSides> = {
  title: "ui/Tooltip",
  component: AllSides,
};
export default meta;

export const AllVariants: StoryObj<typeof AllSides> = {};
