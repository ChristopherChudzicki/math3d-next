/**
 * The Use.GPU (WebGPU) viewport. This shell imports none of Use.GPU; the
 * renderer loads behind the one `React.lazy` below.
 */
import React, { useCallback, useState } from "react";
import * as Sentry from "@sentry/react";
import { setRendererPreference } from "@/services/renderer/rendererPreference";
import { DEFAULT_RENDERER } from "@/services/renderer/renderers";
import { markWebGpuFailed } from "@/services/renderer/webgpuSupport";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useLoadFlag } from "@/features/viewport/shared/useLoadFlag";

const GpuViewportContent = React.lazy(
  // eslint-disable-next-line import/no-restricted-paths -- the lazy boundary
  () => import("./live/GpuViewportContent"),
);

type Props = {
  className?: string;
  /**
   * When Use.GPU can't start, say so here and leave the stored renderer
   * preference alone, rather than leave it to the page to draw the default;
   * and treat any GPU error as a failure.
   */
  failInPlace?: boolean;
};

const GpuViewport: React.FC<Props> = ({ className, failInPlace = false }) => {
  const [unsupported, setUnsupported] = useState(false);
  const [ready, onReady] = useLoadFlag();
  const [gpuFailed, failGpu] = useLoadFlag();
  const onUnsupported = useCallback(
    (error: unknown) => {
      if (failInPlace) setUnsupported(true);
      // Use.GPU calls this on every render while in error; report the first.
      if (!markWebGpuFailed()) return;
      // Not `chooseRenderer`: the user didn't choose this, so `?renderer`
      // stays; resolution draws the default once WebGPU has failed.
      if (!failInPlace) setRendererPreference(DEFAULT_RENDERER);
      // A browser or device limitation, not an app error.
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn(error);
      Sentry.captureMessage(`WebGPU unsupported: ${message}`, {
        level: "info",
      });
    },
    [failInPlace],
  );
  // WebGPU invalidates only the command that failed, and the rest draw; a
  // capture can't trust the frame, but an editor's scene stays up.
  const onGpuError = useCallback(
    (error: Error) => {
      if (failInPlace) failGpu();
      // eslint-disable-next-line no-console
      console.error(error);
      Sentry.captureException(error);
    },
    [failInPlace, failGpu],
  );

  return (
    <ViewportShell
      renderer="usegpu"
      errorMessage="The Use.GPU renderer ran into an error."
      ready={ready}
      unsupported={unsupported}
      unsupportedMessage="The Use.GPU renderer can't run in this browser."
      failed={gpuFailed}
      className={className}
    >
      <GpuViewportContent
        onUnsupported={onUnsupported}
        onReady={onReady}
        onGpuError={onGpuError}
      />
    </ViewportShell>
  );
};

export default GpuViewport;
