/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import type { MathfieldOptions } from "mathlive";
import React, { forwardRef } from "react";

import { MathfieldProps } from "..";

const MockMathFieldForwardRef = (
  props: MathfieldProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const { children, onChange, className, ...others } = props;

  return (
    <textarea
      {...others}
      className={className}
      value={children}
      aria-label={props["aria-label"]}
      // @ts-expect-error for e.target should be MathfieldElement but is Textarea
      onChange={onChange}
      ref={ref}
    />
  );
};

export default forwardRef(MockMathFieldForwardRef);
