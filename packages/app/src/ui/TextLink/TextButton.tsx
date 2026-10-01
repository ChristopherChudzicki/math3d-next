import React from "react";
import classNames from "classnames";
import { Button as BaseButton } from "@base-ui/react/button";
import * as styles from "./TextLink.module.css";

type TextButtonProps = Omit<BaseButton.Props, "className"> & {
  className?: string;
};

/**
 * A button styled as a TextLink, for an action inside running text ("Sign in
 * to save scenes"). Anything that navigates should be a TextLink. Keep the
 * label short: a button can't wrap across lines the way a link can.
 */
const TextButton: React.FC<TextButtonProps> = ({ className, ...others }) => (
  <BaseButton
    {...others}
    className={classNames(styles.text, styles.button, className)}
  />
);

export default TextButton;
export type { TextButtonProps };
