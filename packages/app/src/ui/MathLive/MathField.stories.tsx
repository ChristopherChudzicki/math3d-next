/* eslint-disable react/jsx-no-bind */
import type { Meta, StoryFn } from "@storybook/react-vite";
import React, { useState } from "react";

import MathField from "./MathField";

export default {
  title: "MathField",
  component: MathField,
  argTypes: { onChange: { action: "onChange" } },
} as Meta<typeof MathField>;

export const Simple: StoryFn<typeof MathField> = (args) => (
  <MathField
    {...args}
    style={{
      border: "1pt solid blue",
      borderRadius: "8px",
      width: "min-content",
    }}
    options={{ readOnly: true }}
    value={String.raw`1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots = \frac{\pi^2}{6}`}
  />
);

export const Overflowing: StoryFn<typeof MathField> = (args) => (
  <div style={{ width: 100, border: "1pt solid red" }}>
    <MathField
      {...args}
      style={{
        border: "1pt solid blue",
        borderRadius: "8px",
        width: "min-content",
      }}
      value={String.raw`1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots = \frac{\pi^2}{6}`}
    />
  </div>
);

export const Static: StoryFn<typeof MathField> = (args) => (
  <div
    style={{
      border: "1pt solid red",
      width: 100,
      height: 50,
      overflowX: "visible",
    }}
  >
    <MathField
      {...args}
      style={{ width: "min-content" }}
      options={{ readOnly: true }}
      value="E=mc^2"
    />
  </div>
);

export const Controlled: StoryFn<typeof MathField> = (args) => {
  const [latex, setLatex] = useState("E=mc^2");
  return (
    <div>
      <MathField
        {...args}
        value={latex}
        onChange={(event) => {
          setLatex(event.target.value);
        }}
      />
      <textarea
        name="latex"
        id="latex"
        cols={30}
        rows={10}
        value={latex}
        onChange={(event) => {
          setLatex(event.target.value);
        }}
      />
      {latex}
    </div>
  );
};
