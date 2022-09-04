/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { MathfieldOptions } from "mathlive";
import React, { forwardRef } from "react";

import { MathfieldProps } from "..";

const MockMathFieldForwardRef = (
  props: MathfieldProps,
  ref: React.Ref<HTMLTextAreaElement>
) => {
  const { children, onChange, className, makeOptions } = props;

  const readOnly = makeOptions && makeOptions({} as MathfieldOptions).readOnly;

  return (
    <textarea
      className={className}
      value={children}
      readOnly={readOnly}
      aria-label={props["aria-label"]}
      // @ts-expect-error for e.target should be MathfieldElement but is Textarea
      onChange={onChange}
      ref={ref}
    />
  );
};

export default forwardRef(MockMathFieldForwardRef);
