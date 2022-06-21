import classNames from "classnames";
import React from "react";
import SmallMathField, { makeReadOnly } from "util/components/SmallMathField";

import styles from "./widget.module.css";

interface Props {
  value: string;
}

const ReadonlyMathField: React.FC<Props> = ({ value }) => (
  <SmallMathField
    className={classNames(styles["static-math"], "align-self-center", "px-1")}
    makeOptions={makeReadOnly}
    defaultValue={value}
  />
);

export default ReadonlyMathField;
