/* eslint-disable react/jsx-no-bind */
import type { Meta, StoryFn } from "@storybook/react-vite";
import React, { useState } from "react";

import { colors, gradients } from "@math3d/mathitem-configs";
import ColorPicker, { OnColorChange } from "./ColorPicker";

const colorsAndGradients = [
  ...colors,
  ...[gradients.rainbow, gradients.bluered, gradients.temperature],
];

export default {
  title: "ColorPicker",
  component: ColorPicker,
  argTypes: { onChange: { action: "onChange" } },
  // The picker fills its container; the app's color popover is 18rem wide.
  decorators: [
    (Story) => (
      <div style={{ width: "18rem" }}>
        <Story />
      </div>
    ),
  ],
} as Meta<typeof ColorPicker>;

export const Uncontrolled: StoryFn<typeof ColorPicker> = (args) => (
  <ColorPicker {...args} value="red" colors={colorsAndGradients} />
);

export const Controlled: StoryFn<typeof ColorPicker> = (args) => {
  const [color, setColor] = useState("blue");
  const onChange: OnColorChange = (event) => {
    setColor(event.value);
    if (args.onChange) {
      args.onChange(event);
    }
  };
  return (
    <ColorPicker
      {...args}
      value={color}
      colors={colorsAndGradients}
      onChange={onChange}
    />
  );
};
