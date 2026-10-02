import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import TextField from "./TextField";

const states = ["rest", "hover", "focus-visible", "disabled"] as const;

const AllTextFields: React.FC = () => (
  <div style={{ display: "grid", gap: 16, width: 280 }}>
    {states.map((state) => (
      <TextField
        key={state}
        label={`Filter scenes (${state})`}
        placeholder="Title contains…"
        data-pseudo={state}
        disabled={state === "disabled"}
      />
    ))}
    <TextField label="With a value" defaultValue="Parametric surfaces" />
  </div>
);

const meta: Meta<typeof AllTextFields> = {
  title: "ui/TextField",
  component: AllTextFields,
};
export default meta;

export const AllVariants: StoryObj<typeof AllTextFields> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"]'],
      focusVisible: ['[data-pseudo="focus-visible"]'],
    },
  },
};
