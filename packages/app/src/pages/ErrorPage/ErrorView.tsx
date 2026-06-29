import React, { useCallback, useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import copy from "./errorPage.copy";
import BrokenTorus from "./BrokenTorus";
import * as styles from "./ErrorPage.module.css";

interface ErrorViewProps {
  /** Human-readable error message (shown in the collapsible details). */
  message?: string;
  /** Stack trace, if available. */
  stack?: string;
  /** Invoked by the primary "Reload page" action. */
  onReload?: () => void;
  /** Where "Back to home" points; a real navigation for a clean reload. */
  homeHref?: string;
  /** Where "Report this bug" points. */
  reportHref?: string;
}

const defaultReload = () => window.location.reload();

/** Hide content visually while keeping it available to screen readers. */
const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const TechnicalDetails: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard unavailable (insecure context) or denied: leave the label
      // unchanged rather than falsely confirming a copy.
    }
  }, [text]);

  // Revert the confirmation so a later copy can re-confirm.
  useEffect(() => {
    if (!copied) return undefined;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{copy.detailsSummary}</summary>
      <div className={styles["details-body"]}>
        <div className={styles["details-toolbar"]}>
          <Button
            variant="text"
            size="small"
            color="secondary"
            startIcon={<ContentCopyRoundedIcon fontSize="inherit" />}
            onClick={handleCopy}
          >
            {copied ? copy.copied : copy.copy}
          </Button>
        </div>
        <pre className={styles.trace}>{text}</pre>
        <span role="status" aria-live="polite" style={visuallyHidden}>
          {copied ? copy.copied : ""}
        </span>
      </div>
    </details>
  );
};

/**
 * Presentational fallback error page. Router-free and side-effect-free (beyond
 * the optional reload), so it can be rendered and tested in isolation, and is
 * the single place to apply copy/design feedback.
 */
const ErrorView: React.FC<ErrorViewProps> = ({
  message,
  stack,
  onReload = defaultReload,
  homeHref = copy.homeHref,
  reportHref = copy.reportHref,
}) => {
  // `error.stack` usually already begins with the message, so avoid repeating it.
  const detailsText =
    stack && message && stack.includes(message)
      ? stack
      : [message, stack].filter(Boolean).join("\n\n");

  // Move focus to the message on mount so the swapped-in error is announced and
  // keyboard users aren't left on a detached node from the crashed view.
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    alertRef.current?.focus();
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.brandbar}>
        <span className={styles.brand}>Math3d</span>
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <BrokenTorus className={styles.torus} />
          <div
            className={styles.message}
            role="alert"
            tabIndex={-1}
            ref={alertRef}
          >
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 className={styles.title}>{copy.title}</h1>
            <p className={styles.body}>{copy.body}</p>
          </div>
          <div className={styles.actions}>
            <Button
              variant="contained"
              disableElevation
              startIcon={<ReplayRoundedIcon />}
              onClick={onReload}
            >
              {copy.reload}
            </Button>
            <Button variant="outlined" color="secondary" href={homeHref}>
              {copy.home}
            </Button>
          </div>
          <div className={styles.footer}>
            {detailsText ? <TechnicalDetails text={detailsText} /> : null}
            <a
              className={styles.report}
              href={reportHref}
              target="_blank"
              rel="noreferrer"
            >
              {copy.report}
              <OpenInNewRoundedIcon
                className={styles["report-icon"]}
                fontSize="inherit"
              />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ErrorView;
