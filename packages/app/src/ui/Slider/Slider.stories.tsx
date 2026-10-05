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
          data-story-state={state}
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
    // Not data-pseudo: preview.css outlines that element, and the root
    // isn't what takes focus here; the thumb and its hidden input are.
    pseudo: {
      hover: ['[data-story-state="hover"] [data-index]'],
      focusVisible: ['[data-story-state="focus-visible"] input'],
    },
  },
};
