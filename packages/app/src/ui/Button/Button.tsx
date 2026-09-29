import React from "react";
import classNames from "classnames";
import { Button as BaseButton } from "@base-ui/react/button";
import * as styles from "./Button.module.css";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonTone = "neutral" | "accent" | "danger";
type ButtonSize = "sm" | "md";

type ButtonProps = Omit<BaseButton.Props, "className"> & {
  /** How the tone is applied: filled, outlined, or text only. */
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  /**
   * Disables the button but keeps it focusable, so keyboard focus is not
   * dropped to the page while an action is in flight.
   */
  loading?: boolean;
  className?: string;
};

const Button: React.FC<ButtonProps> = ({
  variant = "outline",
  tone = "neutral",
  size = "md",
  loading = false,
  disabled = false,
  focusableWhenDisabled = false,
  className,
  ...others
}) => (
  <BaseButton
    {...others}
    disabled={disabled || loading}
    focusableWhenDisabled={focusableWhenDisabled || loading}
    aria-busy={loading || undefined}
    className={classNames(
      styles.button,
      styles[variant],
      styles[tone],
      styles[size],
      className,
    )}
  />
);

export default Button;
export type { ButtonProps, ButtonVariant, ButtonTone, ButtonSize };
