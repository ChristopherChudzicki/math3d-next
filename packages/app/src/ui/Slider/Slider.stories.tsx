import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Slider from "./Slider";

const states = ["rest", "hover", "focus-visible", "disabled"] as const;

const AllSliders: React.FC = () => (
  <div style={{ display: "grid", gap: 16, width: 280 }}>
    {states.map((state) => (
      <div key={state} style={{ display: "grid", gap: 4 }}>
        {state}
        <Slider
          aria-label={state}
          min={-5}
          max={5}
          step={0.1}
          largeStep={1}
          defaultValue={1.5}
          disabled={state === "disabled"}
          data-pseudo={state}
        />
      </div>
    ))}
  </div>
);

const meta: Meta<typeof AllSliders> = {
  title: "ui/Slider",
  component: AllSliders,
};
export default meta;

export const AllVariants: StoryObj<typeof AllSliders> = {
  parameters: {
    pseudo: {
      hover: ['[data-pseudo="hover"] [data-index]'],
      focusVisible: ['[data-pseudo="focus-visible"] input'],
    },
  },
};
