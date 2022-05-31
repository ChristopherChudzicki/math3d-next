/* eslint-disable react/jsx-no-bind */
import React, { useState } from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import MathField from "./MathField";

export default {
  title: "MathField",
  component: MathField,
  argTypes: { onChange: { action: "onChange" } },
} as ComponentMeta<typeof MathField>;

export const Simple: ComponentStory<typeof MathField> = (args) => (
  <MathField
    {...args}
    style={{
      border: "1pt solid blue",
      borderRadius: "8px",
      width: "min-content",
    }}
    makeOptions={() => ({ readOnly: true })}
  >
    {String.raw`1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots = \frac{\pi^2}{6}`}
  </MathField>
);

export const Overflowing: ComponentStory<typeof MathField> = (args) => (
  <div style={{ width: 100, border: "1pt solid red" }}>
    <MathField
      {...args}
      style={{
        border: "1pt solid blue",
        borderRadius: "8px",
        width: "min-content",
      }}
    >
      {String.raw`1 + \frac{1}{4} + \frac{1}{9} + \frac{1}{16} + \cdots = \frac{\pi^2}{6}`}
    </MathField>
  </div>
);

export const Static: ComponentStory<typeof MathField> = (args) => (
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
      makeOptions={() => ({ readOnly: true })}
    >
      E=mc^2
    </MathField>
  </div>
);

export const Controlled: ComponentStory<typeof MathField> = (args) => {
  const [latex, setLatex] = useState("E=mc^2");
  return (
    <div>
      <MathField
        {...args}
        onChange={(event) => {
          setLatex(event.target.value);
        }}
      >
        {latex}
      </MathField>
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
