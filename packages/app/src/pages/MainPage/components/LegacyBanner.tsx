import React, { useEffect } from "react";
import Button from "@mui/material/Button";
import { useBanners } from "@/features/banners/BannerContext";

const DISMISSED_KEY = "legacyBannerDismissed";
const BANNER_ID = "legacy-scene";

type LegacyBannerProps = {
  sceneKey: string;
  onViewDetails: () => void;
  /**
   * How long the confirmation message stays up before auto-closing.
   * Overridable so tests don't need to wait out the real duration.
   */
  confirmationDurationMs?: number;
};

// Registers this scene's legacy notice with the shared banner system rather
// than rendering anything itself. sceneKey is only used as an effect
// dependency: it re-registers on navigation to a different legacy scene, so
// a plain (not "remember"-checked) dismissal on one scene doesn't suppress
// the notice on the next one. Permanent dismissal is checked fresh from
// localStorage on every registration via persistKey, so it stays suppressed
// across scenes as intended.
const LegacyBanner: React.FC<LegacyBannerProps> = ({
  sceneKey,
  onViewDetails,
  confirmationDurationMs,
}) => {
  const { show, dismiss } = useBanners();

  useEffect(() => {
    show({
      id: BANNER_ID,
      severity: "warning",
      confirmedSeverity: "info",
      persistKey: DISMISSED_KEY,
      ariaLabel: "Dismiss legacy scene notice",
      rememberLabel: "Don't show this automatically again for any legacy scene",
      confirmationDurationMs,
      content: (
        <>
          This scene was created with an older version of Math3d.{" "}
          <Button size="small" onClick={onViewDetails}>
            View details
          </Button>
        </>
      ),
      confirmedContent: (
        <>
          Got it — this won&apos;t show automatically again on any legacy scene
          in this browser. The old-site link is still available from the small
          &quot;Legacy Scene&quot; button in the bottom-right corner.
        </>
      ),
    });
    return () => dismiss(BANNER_ID);
  }, [sceneKey, onViewDetails, confirmationDurationMs, show, dismiss]);

  return null;
};

export default LegacyBanner;
export type { LegacyBannerProps };
