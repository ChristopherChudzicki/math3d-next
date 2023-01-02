/* eslint-disable react/jsx-no-bind */
import { ComponentMeta, ComponentStory } from "@storybook/react";
import React, { useState } from "react";

import { colors, gradients } from "../../../configs/colors";
import ColorPicker, { OnColorChange } from "./ColorPicker";

const colorsAndGradients = [
  ...colors,
  ...[gradients.rainbow, gradients.bluered, gradients.temperature],
];

export default {
  title: "ColorPicker",
  component: ColorPicker,
  argTypes: { onChange: { action: "onChange" } },
} as ComponentMeta<typeof ColorPicker>;

export const Uncontrolled: ComponentStory<typeof ColorPicker> = (args) => (
  <ColorPicker {...args} value="red" colors={colorsAndGradients} />
);

export const Controlled: ComponentStory<typeof ColorPicker> = (args) => {
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
