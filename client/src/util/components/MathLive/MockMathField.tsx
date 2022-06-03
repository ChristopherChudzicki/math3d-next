/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import React from "react";
import { MathfieldProps } from ".";

const MockMathFieldForwardRef = (
  props: MathfieldProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const { children, onChange, title } = props;

  return (
    // @ts-expect-error for e.target should be MathfieldElement but is Textarea
    <textarea value={children} title={title} onChange={onChange} ref={ref} />
  );
};

jest.mock(".", () => {
  const { forwardRef } = require("react");
  return {
    MathField: forwardRef(MockMathFieldForwardRef),
  };
});
