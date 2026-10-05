import React from "react";
import classNames from "classnames";
import { Field } from "@base-ui/react/field";
import * as styles from "./TextField.module.css";

type TextFieldProps = Omit<Field.Control.Props, "className"> & {
  /** Visible label; also the input's accessible name. */
  label: string;
  /** Shown below the input and linked to it as its description. */
  description?: React.ReactNode;
  /** Marks the input invalid and shows `description` as an error. */
  invalid?: boolean;
  /** Content inside the input's border, before the text. */
  startAdornment?: React.ReactNode;
  className?: string;
};

/**
 * A labelled text input. Props other than those above go to the input.
 */
const TextField: React.FC<TextFieldProps> = ({
  label,
  description,
  invalid,
  startAdornment,
  className,
  ...others
}) => (
  <Field.Root invalid={invalid} className={classNames(styles.field, className)}>
    <Field.Label className={styles.label}>{label}</Field.Label>
    <div className={styles.box}>
      {startAdornment ? (
        <span className={styles.adornment}>{startAdornment}</span>
      ) : null}
      <Field.Control {...others} className={styles.input} />
    </div>
    {description ? (
      <Field.Description className={styles.description}>
        {description}
      </Field.Description>
    ) : null}
  </Field.Root>
);

export default TextField;
export type { TextFieldProps };
