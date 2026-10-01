import React from "react";
import classNames from "classnames";
import * as styles from "./ButtonGroup.module.css";

type ButtonGroupProps = Omit<
  React.ComponentProps<"div">,
  "role" | "className"
> & {
  className?: string;
};

/**
 * Joins its children edge to edge, as one control. Children need not be
 * buttons; name the group with `aria-label` when its purpose isn't obvious.
 */
const ButtonGroup: React.FC<ButtonGroupProps> = ({ className, ...others }) => (
  <div
    {...others}
    role="group"
    className={classNames(styles.group, className)}
  />
);

export default ButtonGroup;
export type { ButtonGroupProps };
