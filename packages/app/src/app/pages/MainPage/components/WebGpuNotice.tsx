import React, { useEffect } from "react";
import { useBanners } from "@/ui/Banners/BannerContext";

const BANNER_ID = "webgpu-unavailable";

const CONTENT = {
  link: "This link asks for the experimental WebGPU renderer, which isn't available in this browser. Showing the scene with the default renderer.",
  failed:
    "The WebGPU renderer couldn't start on this device. Showing the scene with the default renderer.",
};

type WebGpuNoticeReason = keyof typeof CONTENT;

/** Registers the notice for a WebGPU renderer that can't draw this scene. */
const WebGpuNotice: React.FC<{ reason: WebGpuNoticeReason | null }> = ({
  reason,
}) => {
  const { show, dismiss } = useBanners();

  useEffect(() => {
    if (!reason) return undefined;
    show({
      id: BANNER_ID,
      severity: "info",
      ariaLabel: "Dismiss WebGPU notice",
      content: CONTENT[reason],
    });
    return () => dismiss(BANNER_ID);
  }, [reason, show, dismiss]);

  return null;
};

export default WebGpuNotice;
export type { WebGpuNoticeReason };
