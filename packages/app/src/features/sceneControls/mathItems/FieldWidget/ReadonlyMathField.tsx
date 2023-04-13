import React from "react";
import SmallMathField from "@/util/components/SmallMathField";
import classNames from "classnames";
import styles from "./widget.module.css";

interface Props {
  value: string;
  className?: string;
}

const ReadonlyMathField: React.FC<Props> = ({ value, className }) => (
  <SmallMathField
    tabIndex={-1}
    className={classNames(
      "align-self-center px-1",
      styles["readonly-mathfield"],
      styles["field-widget"],
      className
    )}
    readOnly
  >
    {value}
  </SmallMathField>
);

export default ReadonlyMathField;
