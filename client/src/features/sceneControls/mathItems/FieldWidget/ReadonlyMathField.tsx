import React from "react";
import { MathfieldProps } from "@/util/components/MathLive";
import SmallMathField from "@/util/components/SmallMathField";
import classNames from "classnames";
import styles from "./widget.module.css";

interface Props {
  value: string;
}

const makeReadOnly: MathfieldProps["makeOptions"] = () => ({
  readOnly: true,
});

const ReadonlyMathField: React.FC<Props> = ({ value }) => (
  <SmallMathField
    tabIndex={-1}
    className={classNames("align-self-center px-1", styles["field-widget"])}
    makeOptions={makeReadOnly}
  >
    {value}
  </SmallMathField>
);

export default ReadonlyMathField;
