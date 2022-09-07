import mergeClassNames from "classnames";
import React, { forwardRef } from "react";
import { useToggle } from "@/util/hooks";

import styles from "./SubtleButton.module.css";

export type SubtleButtonProps = Omit<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
  "ref"
> & { lighten?: boolean; centered?: boolean };

const SubtleButton = forwardRef<HTMLButtonElement, SubtleButtonProps>(
  (props, ref) => {
    // use opacity to darken, brightness to lighten?
    const { lighten = false, disabled, centered, ...others } = props;
    const [isPressed, setIsPressed] = useToggle(false);

    return (
      <button
        {...others}
        ref={ref}
        type="button"
        onPointerDown={setIsPressed.on}
        onPointerUp={setIsPressed.off}
        onPointerLeave={setIsPressed.off}
        className={mergeClassNames(props.className, {
          [styles["subtle-button"]]: true,
          [styles.lighten]: lighten && !disabled,
          [styles.darken]: !lighten && !disabled,
          [styles.pressed]: isPressed && !disabled,
          [styles.centered]: centered,
        })}
      >
        {props.children}
      </button>
    );
  }
);
SubtleButton.displayName = "SubtleButton";

export default SubtleButton;
