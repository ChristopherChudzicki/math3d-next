import classNames from "classnames";
import React from "react";
import styles from "./LoadingSpinner.module.css";

type SpinnerProps = {
  /** A CSS length; defaults to 40px. */
  size?: string;
  className?: string;
};

/** A decorative spinner, for beside text that says what is loading. */
const Spinner: React.FC<SpinnerProps> = ({ size, className }) => (
  <span
    className={classNames(styles.spinner, className)}
    style={size ? ({ "--size": size } as React.CSSProperties) : undefined}
    aria-hidden="true"
  />
);

type LoadingSpinnerProps = {
  className?: string;
  /** Accessible name of the progressbar. */
  label?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  label = "Loading",
}) => {
  return (
    <div className={classNames(styles["loading-container"], className)}>
      <div role="progressbar" aria-label={label}>
        <Spinner />
      </div>
    </div>
  );
};

export default LoadingSpinner;
export { Spinner };
