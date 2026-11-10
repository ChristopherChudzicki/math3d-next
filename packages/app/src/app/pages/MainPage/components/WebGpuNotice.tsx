import React, { useEffect } from "react";
import { useBanners } from "@/ui/Banners/BannerContext";
import type { NoticeReason } from "@/services/renderer/resolveRenderer";

const BANNER_ID = "webgpu-notice";

const CONTENT: Record<NoticeReason, string> = {
  link: "This link asks for the experimental Use.GPU renderer, which isn't available in this browser. Showing the scene with the default renderer.",
  failed: "The Use.GPU renderer couldn't start on this device.",
};

/** Registers the banner saying why the Use.GPU renderer isn't in use. */
const WebGpuNotice: React.FC<{ reason: NoticeReason | null }> = ({
  reason,
}) => {
  const { show, dismiss } = useBanners();

  useEffect(() => {
    if (!reason) return undefined;
    show({
      id: BANNER_ID,
      severity: "info",
      ariaLabel: "Dismiss Use.GPU notice",
      content: CONTENT[reason],
    });
    return () => dismiss(BANNER_ID);
  }, [reason, show, dismiss]);

  return null;
};

export default WebGpuNotice;
