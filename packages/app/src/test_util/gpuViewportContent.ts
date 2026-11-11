import type { ViewportHooks } from "@math3d/viewport-spec";

export type ContentProps = Pick<ViewportHooks, "onUnsupported" | "onReady">;

const RendersNothing = (_props: ContentProps): null => null;

// Stands in for usegpu/live/GpuViewportContent; a test swaps in how it behaves.
export const gpuContent = { Component: RendersNothing, RendersNothing };
