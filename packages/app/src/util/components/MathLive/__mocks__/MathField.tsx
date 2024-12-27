import React from "react";

import { MathfieldProps } from "..";

const MockMathField = (
  props: MathfieldProps & {
    ref?: React.Ref<HTMLTextAreaElement>;
  },
) => {
  const {
    value: children,
    onChange = () => {
      // React(?) throws an error for textarea with value but no onChange
      // Add this to avoid the error and warn about unexpected onChange calls
      throw new Error("Unexpected onChange call");
    },
    className,
    options,
    ...others
  } = props;
  return (
    // eslint-disable-next-line jsx-a11y/role-supports-aria-props
    <textarea
      {...others}
      // mathlive uses 'math' role for its interactive math elements
      // eslint-disable-next-line jsx-a11y/no-interactive-element-to-noninteractive-role
      role="math"
      data-mathfield
      className={className}
      value={children}
      aria-label={props["aria-label"]}
      aria-invalid={props["aria-invalid"]}
      // @ts-expect-error for e.target should be MathfieldElement but is Textarea
      onChange={onChange}
      readOnly={options?.readOnly}
    />
  );
};

export default MockMathField;
