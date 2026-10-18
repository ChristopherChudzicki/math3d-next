import React from "react";
import { Spinner } from "@/ui/LoadingSpinner";
import styles from "./WaitingForConnection.module.css";

/** Stands in for the editor while the scene's fetch is paused offline. */
const WaitingForConnection: React.FC = () => (
  <div className={styles.container} role="status">
    <Spinner size="1.5rem" />
    <p className={styles.message}>
      You&rsquo;re offline. This scene will load when you reconnect.
    </p>
  </div>
);

export default WaitingForConnection;
