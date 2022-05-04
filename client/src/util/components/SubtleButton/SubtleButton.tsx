import React, { useState } from "react";
import mergeClassNames from "classnames";
import styles from "./SubtleButton.module.css";

export type Props = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & { lighten?: boolean };

const SubtleButton: React.FC<Props> = (props) => {
  // use opacity to darken, brightness to lighten?
  const { lighten = false } = props;

  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      {...props}
      type="button"
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      className={mergeClassNames(props.className, {
        [styles["subtle-button"]]: true,
        [styles.lighten]: lighten,
        [styles.darken]: !lighten,
        [styles.pressed]: isPressed,
      })}
    >
      {props.children}
    </button>
  );
};

export default SubtleButton;
