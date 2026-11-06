import type { WebGpuSupport } from "./webgpuSupport";

const RENDERERS = ["mathbox", "usegpu"] as const;
type Renderer = (typeof RENDERERS)[number];

const isRenderer = (value: unknown): value is Renderer =>
  RENDERERS.includes(value as Renderer);

type ResolvedRenderer = {
  /** `null` while Use.GPU is requested and WebGPU detection is pending. */
  renderer: Renderer | null;
  /** `true` when the URL asked for Use.GPU and this browser can't run it. */
  notice: boolean;
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
  const requested = isRenderer(param) ? param : preference;
  if (requested !== "usegpu") return { renderer: "mathbox", notice: false };
  if (webgpu === "pending") return { renderer: null, notice: false };
  if (webgpu === "available") return { renderer: "usegpu", notice: false };
  return { renderer: "mathbox", notice: param === "usegpu" };
};

export { RENDERERS, isRenderer, resolveRenderer };
export type { Renderer, ResolvedRenderer };
