export type ContentProps = { onUnsupported: (error: unknown) => void };

const RendersNothing = (_props: ContentProps): null => null;

// Stands in for usegpu/live/GpuViewportContent; a test swaps in how it behaves.
// Each spec keeps its own `vi.mock` of that module, rendering `Component`.
export const gpuContent = { Component: RendersNothing, RendersNothing };
