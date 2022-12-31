import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";

import SubtleButton from "./SubtleButton";

export default {
  title: "SubtleButton",
  component: SubtleButton,
  argTypes: {
    value: {
      control: { disable: true },
    },
    onChange: {
      action: "changed",
    },
  },
} as ComponentMeta<typeof SubtleButton>;

export const DefaultRender: ComponentStory<typeof SubtleButton> = (args) => (
  <div style={{ padding: "3em", border: "1pt solid black" }}>
    <SubtleButton {...args}>Click me!</SubtleButton>
  </div>
);

export const LightenVariant: ComponentStory<typeof SubtleButton> = (args) => (
  <div style={{ padding: "3em", backgroundColor: "rgb(186, 231, 255)" }}>
    <SubtleButton lighten {...args}>
      Click me!
    </SubtleButton>
  </div>
);
