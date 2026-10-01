import React from "react";
import classNames from "classnames";
import { Button as BaseButton } from "@base-ui/react/button";
import * as styles from "./Button.module.css";

type ButtonVariant = "solid" | "outline" | "ghost";
type ButtonTone = "neutral" | "accent" | "danger";
type ButtonSize = "sm" | "md";

type ButtonStyleProps = {
  /** How the tone is applied: filled, outlined, or text only. */
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
};

/** Button's classes, for elements that look like a button but aren't one. */
const buttonClassName = ({
  variant = "outline",
  tone = "neutral",
  size = "md",
}: ButtonStyleProps): string =>
  classNames(styles.button, styles[variant], styles[tone], styles[size]);

type ButtonProps = Omit<BaseButton.Props, "className"> &
  ButtonStyleProps & {
    /**
     * Disables the button but keeps it focusable, so keyboard focus is not
     * dropped to the page while an action is in flight.
     */
    loading?: boolean;
    className?: string;
  };

const Button: React.FC<ButtonProps> = ({
  variant,
  tone,
  size,
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
    className={classNames(buttonClassName({ variant, tone, size }), className)}
  />
);

export default Button;
export { buttonClassName };
export type {
  ButtonProps,
  ButtonStyleProps,
  ButtonVariant,
  ButtonTone,
  ButtonSize,
};
