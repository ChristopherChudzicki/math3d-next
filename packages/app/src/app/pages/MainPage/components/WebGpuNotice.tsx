import React, { useEffect } from "react";
import { useBanners } from "@/ui/Banners/BannerContext";

const BANNER_ID = "webgpu-unavailable";

/** Registers the notice for a link that asks for WebGPU this browser lacks. */
const WebGpuNotice: React.FC<{ active: boolean }> = ({ active }) => {
  const { show, dismiss } = useBanners();

  useEffect(() => {
    if (!active) return undefined;
    show({
      id: BANNER_ID,
      severity: "info",
      ariaLabel: "Dismiss WebGPU notice",
      content:
        "This link asks for the experimental WebGPU renderer, which isn't available in this browser. Showing the scene with the default renderer.",
    });
    return () => dismiss(BANNER_ID);
  }, [active, show, dismiss]);

  return null;
};

export default WebGpuNotice;
