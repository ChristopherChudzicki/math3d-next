import React, { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import TextareaAutoWidthHeight from "./TextareaAutoWidthHeight";

export default {
  title: "TextareaAutoWidthHeight",
  component: TextareaAutoWidthHeight,
  argTypes: {
    value: {
      control: { disable: true },
    },
    onChange: {
      action: "changed",
    },
  },
} as ComponentMeta<typeof TextareaAutoWidthHeight>;

const Template: ComponentStory<typeof TextareaAutoWidthHeight> = (args) => {
  const { onChange, value, ...otherArgs } = args;
  const [text, setText] = useState(value);
  return (
    <div
      style={{
        width: "300px",
        height: "100px",
        border: "1pt solid blue",
        display: "flex",
      }}
    >
      <TextareaAutoWidthHeight
        value={text}
        extraWidth={20}
        onChange={(e) => {
          if (onChange) {
            onChange(e);
          }
          setText(e.target.value);
        }}
        {...otherArgs}
      />
    </div>
  );
};

export const DefaultRender = Template.bind({});
DefaultRender.args = {
  value: "woof woof meow",
};

export const WithNewLines = Template.bind({});
WithNewLines.args = {
  value: "woof woof \nmeow \n\nmeoooooow",
};

export const WithCustomFont = Template.bind({});
WithCustomFont.args = {
  style: { fontSize: "20px", fontFamily: "georgia" },
  value: "the quick brown \nfox jumped over the lazy \n\ndog",
};
