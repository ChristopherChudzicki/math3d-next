import React from "react";
import classNames from "classnames";
import { Field } from "@base-ui/react/field";
import * as styles from "./TextField.module.css";

type TextFieldProps = Omit<Field.Control.Props, "className"> & {
  /** Visible label; also the input's accessible name. */
  label: string;
  className?: string;
};

/** A labelled text input. Props other than `label` and `className` go to the input. */
const TextField: React.FC<TextFieldProps> = ({
  label,
  className,
  ...others
}) => (
  <Field.Root className={classNames(styles.field, className)}>
    <Field.Label className={styles.label}>{label}</Field.Label>
    <Field.Control {...others} className={styles.input} />
  </Field.Root>
);

export default TextField;
export type { TextFieldProps };
