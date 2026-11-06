import type { WebGpuSupport } from "./webgpuSupport";

const RENDERERS = ["mathbox", "usegpu"] as const;
type Renderer = (typeof RENDERERS)[number];

const isRenderer = (value: unknown): value is Renderer =>
  RENDERERS.includes(value as Renderer);

/**
 * Why MathBox draws in place of a requested Use.GPU: `link` when the URL asked
 * for it without WebGPU, `failed` once Use.GPU couldn't start.
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
  // Checked first: a failure resets the preference to `mathbox`.
  if (webgpu === "failed") return { renderer: "mathbox", notice: "failed" };
  const requested = isRenderer(param) ? param : preference;
  if (requested !== "usegpu") return { renderer: "mathbox", notice: null };
  if (webgpu === "pending") return { renderer: null, notice: null };
  if (webgpu === "available") return { renderer: "usegpu", notice: null };
  return { renderer: "mathbox", notice: param === "usegpu" ? "link" : null };
};

export { isRenderer, resolveRenderer };
export type { NoticeReason, Renderer, ResolvedRenderer };
