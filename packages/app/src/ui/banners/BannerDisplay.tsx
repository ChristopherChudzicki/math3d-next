import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/offline";
import xIcon from "@iconify-icons/lucide/x";
import Alert from "@/ui/Alert";
import Checkbox from "@/ui/Checkbox";
import IconButton from "@/ui/IconButton";
import { useElementResize, useToggle } from "@/util/hooks";
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
      announce={false}
      action={
        <div className={styles.actions}>
          {showRememberOption ? (
            <Checkbox
              className={styles.remember}
              checked={remember}
              onCheckedChange={(checked) => rememberToggle.set(checked)}
              label={
                banner.rememberLabel ?? "Don't show this automatically again"
              }
            />
          ) : null}
          <IconButton
            size="sm"
            className={styles.dismiss}
            label={banner.ariaLabel ?? "Dismiss notice"}
            onClick={() => onDismiss(remember)}
          >
            <Icon icon={xIcon} aria-hidden="true" />
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const lastHeightRef = useRef<number | null>(null);

  useElementResize(container, () => {
    if (!container) return;
    const { offsetHeight } = container;
    if (lastHeightRef.current === offsetHeight) return;
    lastHeightRef.current = offsetHeight;
    document.body.style.setProperty("--banner-height", `${offsetHeight}px`);
  });

  useEffect(
    () => () => {
      document.body.style.removeProperty("--banner-height");
    },
    [],
  );

  return (
    // The live region is this always-mounted container: a region inserted
    // with its text already inside isn't reliably announced.
    <div ref={setContainer} aria-live="polite">
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
