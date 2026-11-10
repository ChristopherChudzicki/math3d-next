/**
 * The Use.GPU (WebGPU) viewport. This shell imports none of Use.GPU; the
 * renderer loads behind the one `React.lazy` below.
 */
import React, { useCallback } from "react";
import * as Sentry from "@sentry/react";
import { setRendererPreference } from "@/services/renderer/rendererPreference";
import { DEFAULT_RENDERER } from "@/services/renderer/renderers";
import { markWebGpuFailed } from "@/services/renderer/webgpuSupport";
import ViewportShell from "@/features/viewport/shared/ViewportShell";

const GpuViewportContent = React.lazy(
  // eslint-disable-next-line import/no-restricted-paths -- the lazy boundary
  () => import("./live/GpuViewportContent"),
);

type Props = { className?: string };

const GpuViewport: React.FC<Props> = ({ className }) => {
  const onUnsupported = useCallback((error: unknown) => {
    // Use.GPU calls this on every render while in error; report the first.
    if (!markWebGpuFailed()) return;
    // Not `chooseRenderer`: the user didn't choose this, so `?renderer` stays;
    // resolution draws the default once WebGPU has failed.
    setRendererPreference(DEFAULT_RENDERER);
    // A browser or device limitation, not an app error.
    const message = error instanceof Error ? error.message : String(error);
    // eslint-disable-next-line no-console
    console.warn(error);
    Sentry.captureMessage(`WebGPU unsupported: ${message}`, { level: "info" });
  }, []);

  return (
    <ViewportShell
      renderer="usegpu"
      errorMessage="The Use.GPU renderer ran into an error."
      className={className}
    >
      <GpuViewportContent onUnsupported={onUnsupported} />
    </ViewportShell>
  );
};

export default GpuViewport;
