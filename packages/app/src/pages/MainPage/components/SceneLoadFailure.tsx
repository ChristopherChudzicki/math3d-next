import React from "react";
import Alert from "@/ui/Alert";
import Button from "@/ui/Button";
import ButtonLink from "@/ui/ButtonLink";
import styles from "./SceneLoadFailure.module.css";

type Props = {
  status: "error" | "offline";
  onRetry: () => void;
  retrying: boolean;
  /** Changes with each failed attempt, so a failed retry is announced. */
  failedAt: number;
};

/** Stands in for the editor when the route's scene can't be loaded. */
const SceneLoadFailure: React.FC<Props> = ({
  status,
  onRetry,
  retrying,
  failedAt,
}) => (
  <div className={styles.container}>
    {status === "offline" ? (
      <Alert severity="info" className={styles.alert}>
        You&rsquo;re offline. This scene will load when you reconnect.
      </Alert>
    ) : (
      <Alert
        severity="error"
        className={styles.alert}
        action={
          <>
            <ButtonLink size="sm" variant="ghost" to="/">
              New scene
            </ButtonLink>
            <Button size="sm" loading={retrying} onClick={onRetry}>
              Retry
            </Button>
          </>
        }
      >
        {/* Re-keyed, not the Alert, so Retry keeps focus. */}
        <span key={failedAt}>Couldn&rsquo;t load this scene.</span>
      </Alert>
    )}
  </div>
);

export default SceneLoadFailure;
