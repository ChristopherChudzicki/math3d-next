import React, { useEffect, useRef } from "react";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useToggle } from "@/util/hooks";
import { useBanners } from "./BannerContext";
import type { Banner } from "./BannerContext";
import styles from "./BannerDisplay.module.css";

const BannerItem: React.FC<{
  banner: Banner;
  onDismiss: (remember: boolean) => void;
}> = ({ banner, onDismiss }) => {
  const [remember, rememberToggle] = useToggle(false);
  const confirming = banner.stage === "confirming";
  const showRememberOption = !confirming && !!banner.persistKey;
  const severity = confirming
    ? banner.confirmedSeverity ?? banner.severity
    : banner.severity;
  const content =
    confirming && banner.confirmedContent
      ? banner.confirmedContent
      : banner.content;

  return (
    <Alert
      className={styles.banner}
      severity={severity}
      action={
        <div className={styles.actions}>
          {showRememberOption ? (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => rememberToggle.set(e.target.checked)}
                />
              }
              label={
                banner.rememberLabel ?? "Don't show this automatically again"
              }
            />
          ) : null}
          <IconButton
            size="small"
            color="inherit"
            aria-label={banner.ariaLabel ?? "Dismiss notice"}
            onClick={() => onDismiss(remember)}
          >
            <Close fontSize="small" />
          </IconButton>
        </div>
      }
    >
      {content}
    </Alert>
  );
};

// The Scene's WebGL canvas only re-measures on a native window "resize"
// event, which a banner appearing/disappearing doesn't fire on its own
// (Scene.tsx handles that generally via a ResizeObserver on its own
// container). This component's only layout responsibility is keeping
// --banner-height in sync with its own rendered height so the sidebar's
// scroll-height calc (ControlTabs.module.css) stays correct.
const BannerDisplay: React.FC = () => {
  const { banners, dismiss } = useBanners();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const observer = new ResizeObserver(() => {
      document.body.style.setProperty(
        "--banner-height",
        `${container.offsetHeight}px`,
      );
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      document.body.style.removeProperty("--banner-height");
    };
  }, []);

  return (
    <div ref={containerRef}>
      {banners.map((banner) => (
        <BannerItem
          key={banner.id}
          banner={banner}
          onDismiss={(remember) => dismiss(banner.id, remember)}
        />
      ))}
    </div>
  );
};

export default BannerDisplay;
