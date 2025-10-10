import React from "react";
import SmallMathField from "@/util/components/SmallMathField";
import classNames from "classnames";
import * as u from "@/util/styles/utils.module.css";
import styles from "./widget.module.css";

interface Props {
  value: string;
  className?: string;
}

const options = { readOnly: true };

const ReadonlyMathField: React.FC<Props> = ({ value, className }) => (
  <SmallMathField
    tabIndex={-1}
    className={classNames(
      u.alignSelfCenter,
      styles["readonly-mathfield"],
      styles["field-widget"],
      className,
    )}
    options={options}
    value={value}
  />
);

export default ReadonlyMathField;
