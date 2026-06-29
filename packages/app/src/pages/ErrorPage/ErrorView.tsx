import React, { useCallback, useState } from "react";
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

const TechnicalDetails: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
  }, [text]);
  return (
    <details className={styles.details}>
      <summary className={styles.summary}>{copy.detailsSummary}</summary>
      <div className={styles["details-body"]}>
        <Button
          variant="text"
          size="small"
          color="secondary"
          className={styles["copy-button"]}
          startIcon={<ContentCopyRoundedIcon fontSize="inherit" />}
          onClick={handleCopy}
        >
          {copied ? copy.copied : copy.copy}
        </Button>
        <pre className={styles.trace}>{text}</pre>
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
  return (
    <div className={styles.page}>
      <header className={styles.brandbar}>
        <span className={styles.brand}>Math3d</span>
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          <BrokenTorus className={styles.torus} />
          <div className={styles.message} role="alert">
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
            {detailsText ? <TechnicalDetails text={detailsText} /> : <span />}
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
