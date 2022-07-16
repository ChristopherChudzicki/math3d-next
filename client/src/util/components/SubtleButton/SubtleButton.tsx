import mergeClassNames from "classnames";
import React from "react";
import { useToggle } from "util/hooks";

import styles from "./SubtleButton.module.css";

export type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { lighten?: boolean };

const SubtleButton: React.FC<Props> = (props) => {
  // use opacity to darken, brightness to lighten?
  const { lighten = false, disabled } = props;
  const [isPressed, setIsPressed] = useToggle(false);

  return (
    <button
      {...props}
      type="button"
      onPointerDown={setIsPressed.on}
      onPointerUp={setIsPressed.off}
      onPointerLeave={setIsPressed.off}
      className={mergeClassNames(props.className, {
        [styles["subtle-button"]]: true,
        [styles.lighten]: lighten && !disabled,
        [styles.darken]: !lighten && !disabled,
        [styles.pressed]: isPressed && !disabled,
      })}
    >
      {props.children}
    </button>
  );
};

export default SubtleButton;
