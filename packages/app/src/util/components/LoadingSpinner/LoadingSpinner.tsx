import CircularProgress from "@mui/material/CircularProgress";
import classNames from "classnames";
import React from "react";
import styles from "./LoadingSpinner.module.css";

type LoadingSpinnerProps = {
  className?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {
  return (
    <div className={classNames(styles["loading-container"], className)}>
      <CircularProgress />
    </div>
  );
};

export default LoadingSpinner;
