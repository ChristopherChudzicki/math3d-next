import React, { useCallback, useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useToggle } from "@/util/hooks";
import styles from "./LegacyBanner.module.css";

const DISMISSED_KEY = "legacyBannerDismissed";
const DEFAULT_CONFIRMATION_DURATION_MS = 7000;
// Keep in sync with LegacyBanner.module.css's `.banner { min-height: ... }` —
// this is the value ControlTabs subtracts via the --banner-height var below.
const BANNER_HEIGHT_PX = 48;

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type Stage = "warning" | "confirming" | "closed";

type LegacyBannerProps = {
  onViewDetails: () => void;
  /**
   * How long the "you can find this again in the corner" confirmation stays
   * up before auto-closing. Overridable so tests don't need to wait out the
   * real duration.
   */
  confirmationDurationMs?: number;
};

const LegacyBanner: React.FC<LegacyBannerProps> = ({
  onViewDetails,
  confirmationDurationMs = DEFAULT_CONFIRMATION_DURATION_MS,
}) => {
  const [dismissedForever] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === "true",
  );
  const [stage, setStage] = useState<Stage>("warning");
  const [remember, rememberToggle] = useToggle(false);

  const visible = !dismissedForever && stage !== "closed";

  // The Scene's WebGL canvas is sized once by MathBox/threestrap and only
  // re-measures on a native window "resize" event, not on ordinary layout
  // reflows (verified: dismissing the banner without this left the canvas
  // stuck at its old height). Since this banner is what changes the scene's
  // available height, set --banner-height directly (avoiding any ambiguity
  // from two stylesheets both targeting the same custom property) and fire
  // a synthetic resize so the canvas picks up the new size — on every
  // visibility change, including the first time the banner appears.
  useEffect(() => {
    if (!visible) return undefined;
    document.body.style.setProperty("--banner-height", `${BANNER_HEIGHT_PX}px`);
    window.dispatchEvent(new Event("resize"));
    return () => {
      document.body.style.removeProperty("--banner-height");
      window.dispatchEvent(new Event("resize"));
    };
  }, [visible]);

  const handleClose = useCallback(async () => {
    if (stage === "confirming") {
      setStage("closed");
      return;
    }
    if (remember) {
      localStorage.setItem(DISMISSED_KEY, "true");
      setStage("confirming");
      await sleep(confirmationDurationMs);
      setStage("closed");
    } else {
      setStage("closed");
    }
  }, [stage, remember, confirmationDurationMs]);

  if (!visible) return null;

  return (
    <Alert
      className={styles.banner}
      severity={stage === "warning" ? "warning" : "info"}
      action={
        <div className={styles.actions}>
          {stage === "warning" ? (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => rememberToggle.set(e.target.checked)}
                />
              }
              label="Don't show this automatically again"
            />
          ) : null}
          <IconButton
            size="small"
            color="inherit"
            aria-label="Dismiss legacy scene notice"
            onClick={handleClose}
          >
            <Close fontSize="small" />
          </IconButton>
        </div>
      }
    >
      {stage === "warning" ? (
        <>
          This scene was created with an older version of Math3d.{" "}
          <Button size="small" onClick={onViewDetails}>
            View details
          </Button>
        </>
      ) : (
        <>
          Got it — the old-site link is still available from the small
          &quot;Legacy Scene&quot; button in the bottom-right corner.
        </>
      )}
    </Alert>
  );
};

export default LegacyBanner;
export type { LegacyBannerProps };
