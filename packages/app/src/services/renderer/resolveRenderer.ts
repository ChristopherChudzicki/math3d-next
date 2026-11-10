import { DEFAULT_RENDERER, RENDERERS, isRenderer } from "./renderers";
import type { Renderer } from "./renderers";
import type { WebGpuSupport } from "./webgpuSupport";

/**
 * Why Use.GPU isn't drawing: `link` when `?renderer=usegpu` meets a browser
 * without WebGPU; `failed`, for the rest of the page load, once Use.GPU
 * couldn't start.
 */
type NoticeReason = "link" | "failed";

type ResolvedRenderer = {
  /** `null` while Use.GPU is requested and WebGPU detection is pending. */
  renderer: Renderer | null;
  notice: NoticeReason | null;
};

const resolveRenderer = ({
  param,
  preference,
  webgpu,
}: {
  param: string | null;
  preference: Renderer | null;
  webgpu: WebGpuSupport;
}): ResolvedRenderer => {
  const requested =
    (isRenderer(param) ? param : preference) ?? DEFAULT_RENDERER;
  // A Use.GPU failure's notice lasts the page load, whatever is chosen after
  // it, so dismissing it sticks.
  if (webgpu === "failed") {
    const { needsWebGpu } = RENDERERS[requested];
    return {
      renderer: needsWebGpu ? DEFAULT_RENDERER : requested,
      notice: "failed",
    };
  }
  if (!RENDERERS[requested].needsWebGpu) {
    return { renderer: requested, notice: null };
  }
  if (webgpu === "pending") return { renderer: null, notice: null };
  if (webgpu === "available") return { renderer: requested, notice: null };
  return {
    renderer: DEFAULT_RENDERER,
    notice: param === requested ? "link" : null,
  };
};

export { resolveRenderer };
export type { NoticeReason, ResolvedRenderer };
