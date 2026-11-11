/**
 * The Use.GPU (WebGPU) viewport. This shell imports none of Use.GPU; the
 * renderer loads behind the one `React.lazy` below.
 */
import React, { useCallback, useState } from "react";
import * as Sentry from "@sentry/react";
import { setRendererPreference } from "@/services/renderer/rendererPreference";
import { DEFAULT_RENDERER } from "@/services/renderer/renderers";
import { markWebGpuFailed } from "@/services/renderer/webgpuSupport";
import RendererFallback from "@/features/viewport/shared/RendererFallback";
import ViewportShell from "@/features/viewport/shared/ViewportShell";
import { useSceneReady } from "@/features/viewport/shared/useSceneReady";

const GpuViewportContent = React.lazy(
  // eslint-disable-next-line import/no-restricted-paths -- the lazy boundary
  () => import("./live/GpuViewportContent"),
);

type Props = {
  className?: string;
  /**
   * For the `/app/frame` render page: when Use.GPU can't start, say so here
   * and leave the stored renderer preference alone.
   */
  still?: boolean;
};

const GpuViewport: React.FC<Props> = ({ className, still = false }) => {
  const [unsupported, setUnsupported] = useState(false);
  const [ready, onReady] = useSceneReady();
  const onUnsupported = useCallback(
    (error: unknown) => {
      if (still) setUnsupported(true);
      // Use.GPU calls this on every render while in error; report the first.
      if (!markWebGpuFailed()) return;
      // Not `chooseRenderer`: the user didn't choose this, so `?renderer`
      // stays; resolution draws the default once WebGPU has failed.
      if (!still) setRendererPreference(DEFAULT_RENDERER);
      // A browser or device limitation, not an app error.
      const message = error instanceof Error ? error.message : String(error);
      // eslint-disable-next-line no-console
      console.warn(error);
      Sentry.captureMessage(`WebGPU unsupported: ${message}`, {
        level: "info",
      });
    },
    [still],
  );

  return (
    <ViewportShell
      renderer="usegpu"
      errorMessage="The Use.GPU renderer ran into an error."
      ready={ready}
      unsupported={unsupported}
      className={className}
    >
      {unsupported ? (
        <RendererFallback message="The Use.GPU renderer can't run in this browser." />
      ) : (
        <GpuViewportContent onUnsupported={onUnsupported} onReady={onReady} />
      )}
    </ViewportShell>
  );
};

export default GpuViewport;
