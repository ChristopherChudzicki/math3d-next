import React from "react";
import classNames from "classnames";
import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Icon } from "@iconify/react/offline";
import check from "@iconify-icons/lucide/check";
import * as styles from "./Checkbox.module.css";

type CheckboxProps = Omit<BaseCheckbox.Root.Props, "className"> & {
  label: React.ReactNode;
  className?: string;
};

/**
 * A checkbox inside its label, so the whole label is the click target.
 * Props other than `label` and `className` go to Base UI's Checkbox.Root.
 */
const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...others }) => (
  // The rule only recognizes native inputs; Checkbox.Root is the control here.
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  <label className={classNames(styles.label, className)}>
    <BaseCheckbox.Root {...others} className={styles.box}>
      <BaseCheckbox.Indicator className={styles.indicator}>
        <Icon icon={check} aria-hidden="true" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
    {label}
  </label>
);

export default Checkbox;
export type { CheckboxProps };
