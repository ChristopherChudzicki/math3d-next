import CircularProgress from "@mui/material/CircularProgress";
import classNames from "classnames";
import React from "react";
import styles from "./LoadingSpinner.module.css";

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
      <CircularProgress aria-label={label} />
    </div>
  );
};

export default LoadingSpinner;
