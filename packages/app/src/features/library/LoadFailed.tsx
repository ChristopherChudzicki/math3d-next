import React from "react";
import RetryButton from "@/ui/Button/RetryButton";
import type { useKeptFailure } from "@/util/hooks";
import styles from "./ScenesList.module.css";

type LoadFailedProps = Pick<
  ReturnType<typeof useKeptFailure>,
  "retrying" | "failedAttempts" | "retry"
> & { message: string };

/** A list that failed to load, with Try again. */
const LoadFailed: React.FC<LoadFailedProps> = ({
  message,
  retrying,
  failedAttempts,
  retry,
}) => (
  <div className={styles.message}>
    <div role="alert">
      {/* Re-keyed so a failed retry is announced again. */}
      <p key={failedAttempts} className={styles.hint}>
        {message}
      </p>
    </div>
    <RetryButton size="sm" retrying={retrying} onClick={retry} />
  </div>
);

export default LoadFailed;
