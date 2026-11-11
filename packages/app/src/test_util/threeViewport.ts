import type { ViewportHooks, ViewportSpec } from "@math3d/viewport-spec";

export type ThreeViewportProps = {
  spec: ViewportSpec;
  hooks: ViewportHooks;
  transparency?: "oit" | "ordered";
  shading?: "glossy" | "matte";
};

const RendersNothing = (_props: ThreeViewportProps): null => null;

// Stands in for @math3d/renderer-three's Viewport; a test swaps in how it behaves.
export const threeViewport = { Component: RendersNothing, RendersNothing };
