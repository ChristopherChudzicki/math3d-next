import React from "react";
import classNames from "classnames";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import * as styles from "./Switch.module.css";

type SwitchProps = Omit<BaseSwitch.Root.Props, "className"> & {
  className?: string;
};

/**
 * An on/off toggle with no visible label; name it with `aria-label` or
 * `aria-labelledby`. Props go to Base UI's Switch.Root.
 */
const Switch: React.FC<SwitchProps> = ({ className, ...others }) => (
  <BaseSwitch.Root {...others} className={classNames(styles.root, className)}>
    <BaseSwitch.Thumb className={styles.thumb} />
  </BaseSwitch.Root>
);

export default Switch;
export type { SwitchProps };
