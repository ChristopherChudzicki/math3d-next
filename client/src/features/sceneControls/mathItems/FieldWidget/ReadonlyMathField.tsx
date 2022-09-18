import React from "react";
import { MathfieldProps } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";

interface Props {
  value: string;
}

const makeReadOnly: MathfieldProps["makeOptions"] = () => ({
  readOnly: true,
});

const ReadonlyMathField: React.FC<Props> = ({ value }) => (
  <SmallMathField
    tabIndex={-1}
    className="align-self-center px-1"
    makeOptions={makeReadOnly}
  >
    {value}
  </SmallMathField>
);

export default ReadonlyMathField;
