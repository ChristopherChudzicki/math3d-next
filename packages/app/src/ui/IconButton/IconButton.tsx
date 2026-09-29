import React from "react";
import classNames from "classnames";
import Button from "../Button";
import type { ButtonProps } from "../Button";
import * as styles from "./IconButton.module.css";

type IconButtonProps = Omit<ButtonProps, "aria-label" | "aria-labelledby"> & {
  /** Accessible name; required because the button shows only an icon. */
  label: string;
};

const IconButton: React.FC<IconButtonProps> = ({
  label,
  variant = "ghost",
  className,
  ...others
}) => (
  <Button
    {...others}
    variant={variant}
    aria-label={label}
    className={classNames(styles.iconButton, className)}
  />
);

export default IconButton;
export type { IconButtonProps };
