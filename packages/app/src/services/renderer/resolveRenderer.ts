import type { WebGpuSupport } from "./webgpuSupport";

type Renderer = "mathbox" | "usegpu";

const isRenderer = (value: unknown): value is Renderer =>
  value === "mathbox" || value === "usegpu";

type ResolvedRenderer = {
  /** `null` while WebGPU detection is pending. */
  renderer: Renderer | null;
  /** The URL asked for Use.GPU and this browser can't run it. */
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

export { isRenderer, resolveRenderer };
export type { Renderer, ResolvedRenderer };
