/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import React from "react";
import { MathfieldProps } from ".";

const MockMathFieldForwardRef = (
  props: MathfieldProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const { children, onChange, title, className } = props;

  return (
    <textarea
      className={className}
      value={children}
      title={title}
      // @ts-expect-error for e.target should be MathfieldElement but is Textarea
      onChange={onChange}
      ref={ref}
    />
  );
};

jest.mock(".", () => {
  const { forwardRef } = require("react");
  return {
    MathField: forwardRef(MockMathFieldForwardRef),
  };
});
